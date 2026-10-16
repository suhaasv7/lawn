"use server";

// Every export here is callable from the browser, so each one validates its
// input. Supabase only accepts writes that carry LAWN_WRITE_SECRET (server-only),
// so this file is the one way in: nobody can skip these checks by calling the
// database directly with the public key.
import { randomUUID } from "node:crypto";
import { write } from "@/lib/db";
import { runBackup } from "@/lib/backup";
import { Snapshot, listSnapshots, notionConfigured, readSnapshot } from "@/lib/notion";
import { KINDS, MAX_SPAN, MIN_SIZE, TONES, Tile, Zone } from "@/tiles";
import { BASE_KEYS, DEFAULT_SETTINGS, FONTS, HEX, MAX_RADIUS, Settings, Theme, ThemeBase, deriveTheme } from "@/theme";

// Ids go into REST filters unquoted, so keep them to a safe alphabet.
const SAFE_ID = /^[\w-]{1,64}$/;

// Board coordinates (cells): optional on tiles, required on zones.
const isCoord = (v: unknown) => Number.isInteger(v) && Math.abs(v as number) <= 10000;

const isHttpUrl = (u: unknown) => {
  try {
    return typeof u === "string" && /^https?:$/.test(new URL(u).protocol);
  } catch {
    return false;
  }
};

export async function saveTiles(tiles: Tile[]) {
  if (!Array.isArray(tiles) || tiles.length > 200) throw new Error("Invalid tiles");
  const seen = new Set<string>();
  const now = new Date().toISOString();
  const rows = tiles.map((t, position) => {
    const { id, kind, w, h, tone, archived, x, y, ...props } = t;
    const ok =
      typeof id === "string" &&
      SAFE_ID.test(id) &&
      !seen.has(id) &&
      KINDS.includes(kind) &&
      TONES.includes(tone) &&
      Number.isInteger(w) &&
      w >= MIN_SIZE[kind][0] &&
      w <= MAX_SPAN &&
      Number.isInteger(h) &&
      h >= MIN_SIZE[kind][1] &&
      h <= MAX_SPAN &&
      ((kind !== "bookmark" && kind !== "website") || isHttpUrl((t as { url?: unknown }).url)) &&
      (x == null || isCoord(x)) &&
      (y == null || isCoord(y)) &&
      JSON.stringify(props).length <= 10000;
    if (!ok) throw new Error(`Invalid tile: ${String(id)}`);
    seen.add(id);
    return { id, kind, position, w, h, tone, archived: archived === true, x: x ?? null, y: y ?? null, props, updated_at: now };
  });
  // Upsert first, then drop removed tiles, so a failure never loses a tile.
  if (rows.length) await write("POST", "tiles?on_conflict=id", rows, "resolution=merge-duplicates");
  await write("DELETE", rows.length ? `tiles?id=not.in.(${rows.map((r) => r.id).join(",")})` : "tiles?id=not.is.null");
}

export async function saveSettings(s: Settings) {
  const ok =
    (s.mode === "website" || s.mode === "board") &&
    (s.zone_id === null || (typeof s.zone_id === "string" && SAFE_ID.test(s.zone_id))) &&
    (s.theme_id === null || (typeof s.theme_id === "string" && SAFE_ID.test(s.theme_id))) &&
    FONTS.some((f) => f.id === s.font) &&
    Number.isInteger(s.radius) &&
    s.radius >= 0 &&
    s.radius <= MAX_RADIUS;
  if (!ok) throw new Error("Invalid settings");
  const saved = await write("PATCH", "site_settings?id=eq.1", {
    theme_id: s.theme_id,
    font: s.font,
    radius: s.radius,
    mode: s.mode,
    zone_id: s.zone_id,
    updated_at: new Date().toISOString(),
  });
  if (!saved.length) throw new Error("Settings weren't saved");
}

// Same pattern as tiles: upsert what's there, then drop removed zones.
export async function saveZones(zones: Zone[]) {
  if (!Array.isArray(zones) || zones.length > 100) throw new Error("Invalid zones");
  const seen = new Set<string>();
  const rows = zones.map((z, position) => {
    const ok =
      typeof z.id === "string" &&
      SAFE_ID.test(z.id) &&
      !seen.has(z.id) &&
      typeof z.name === "string" &&
      z.name.trim().length >= 1 &&
      z.name.length <= 40 &&
      isCoord(z.x) &&
      isCoord(z.y) &&
      Number.isInteger(z.w) &&
      z.w >= 2 &&
      z.w <= 400 &&
      Number.isInteger(z.h) &&
      z.h >= 2 &&
      z.h <= 400 &&
      TONES.includes(z.tone);
    if (!ok) throw new Error(`Invalid zone: ${String(z.id)}`);
    seen.add(z.id);
    return { id: z.id, name: z.name.trim(), x: z.x, y: z.y, w: z.w, h: z.h, tone: z.tone, position };
  });
  if (rows.length) await write("POST", "zones?on_conflict=id", rows, "resolution=merge-duplicates");
  await write("DELETE", rows.length ? `zones?id=not.in.(${rows.map((r) => r.id).join(",")})` : "zones?id=not.is.null");
}

// Only the five base colors come from the browser (hex only); the rest are
// derived here, so nothing but plain colors ever reaches the page's CSS.
export async function saveTheme(input: ThemeBase & { id?: string }): Promise<Theme> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 40 || !BASE_KEYS.every((k) => HEX.test(input[k]))) throw new Error("Invalid theme");
  const theme = deriveTheme({ ...input, name });
  const id = typeof input.id === "string" && SAFE_ID.test(input.id) ? input.id : randomUUID();
  // Upsert (so a restore can bring back a deleted theme). The database policy
  // refuses writes to presets, which surfaces here as an error.
  try {
    const [saved] = await write<Theme>("POST", "themes?on_conflict=id", { ...theme, id }, "resolution=merge-duplicates");
    return saved;
  } catch {
    throw new Error("Preset themes can't be edited");
  }
}

export async function deleteTheme(id: string) {
  if (typeof id !== "string" || !SAFE_ID.test(id)) throw new Error("Invalid theme id");
  await write("DELETE", `themes?id=eq.${id}`);
}

// Whether a site lets other pages show it in an iframe (checked once, when it's
// added). Sites that refuse get the screenshot preview instead.
export async function canEmbed(url: string): Promise<boolean> {
  if (!isHttpUrl(url)) return false;
  const host = new URL(url).hostname;
  // Don't let the server be pointed at local/private addresses.
  if (/^(localhost|0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(host)) return false;
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(5000), cache: "no-store" });
    const xfo = res.headers.get("x-frame-options")?.toLowerCase() ?? "";
    if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
    const ancestors = res.headers.get("content-security-policy")?.match(/frame-ancestors([^;]*)/i)?.[1].trim();
    return ancestors === undefined || ancestors.split(/\s+/).includes("*");
  } catch {
    return false;
  }
}

// ── Backups (Notion). These return { ok, … } instead of throwing, because
// production hides thrown messages from the browser.
type Result<T> = ({ ok: true } & T) | { ok: false; error: string };
const fail = (e: unknown) => ({ ok: false as const, error: (e as Error).message });

export async function listBackups(): Promise<Result<{ connected: boolean; backups: Snapshot[] }>> {
  if (!notionConfigured) return { ok: true, connected: false, backups: [] };
  try {
    return { ok: true, connected: true, backups: await listSnapshots() };
  } catch (e) {
    return fail(e);
  }
}

export async function backupNow(): Promise<Result<{ skipped: boolean }>> {
  try {
    const r = await runBackup("manual", 60_000);
    return { ok: true, skipped: r.skipped };
  } catch (e) {
    return fail(e);
  }
}

// Replaces the site's cards, zones, custom themes and settings with a snapshot,
// through the same validated saves the editor uses.
export async function restoreBackup(pageId: string): Promise<Result<{ cards: number }>> {
  try {
    if (typeof pageId !== "string" || !/^[0-9a-f-]{32,36}$/i.test(pageId)) throw new Error("Invalid backup id");
    const data = await readSnapshot(pageId);
    for (const t of data.themes) {
      await saveTheme({ id: t.id, name: t.name, bg: t.bg, surface: t.surface, fg: t.fg, muted: t.muted, accent: t.accent });
    }
    await saveZones(data.zones);
    await saveTiles(
      data.tiles.map(
        (r) => ({ ...r.props, id: r.id, kind: r.kind, w: r.w, h: r.h, tone: r.tone, archived: r.archived, x: r.x, y: r.y }) as Tile
      )
    );
    await saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
    return { ok: true, cards: data.tiles.length };
  } catch (e) {
    return fail(e);
  }
}
