"use server";

// Every export here is callable from the browser, so each one validates its
// input. Supabase only accepts writes that carry LAWN_WRITE_SECRET (server-only),
// so this file is the one way in: nobody can skip these checks by calling the
// database directly with the public key.
import { randomUUID } from "node:crypto";
import { write } from "@/lib/db";
import { KINDS, MAX_SPAN, MIN_SIZE, TONES, Tile } from "@/tiles";
import { BASE_KEYS, FONTS, HEX, MAX_RADIUS, Settings, Theme, ThemeBase, deriveTheme } from "@/theme";

// Ids go into REST filters unquoted, so keep them to a safe alphabet.
const SAFE_ID = /^[\w-]{1,64}$/;

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
    const { id, kind, w, h, tone, archived, ...props } = t;
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
      JSON.stringify(props).length <= 10000;
    if (!ok) throw new Error(`Invalid tile: ${String(id)}`);
    seen.add(id);
    return { id, kind, position, w, h, tone, archived: archived === true, props, updated_at: now };
  });
  // Upsert first, then drop removed tiles, so a failure never loses a tile.
  if (rows.length) await write("POST", "tiles?on_conflict=id", rows, "resolution=merge-duplicates");
  await write("DELETE", rows.length ? `tiles?id=not.in.(${rows.map((r) => r.id).join(",")})` : "tiles?id=not.is.null");
}

export async function saveSettings(s: Settings) {
  const ok =
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
    updated_at: new Date().toISOString(),
  });
  if (!saved.length) throw new Error("Settings weren't saved");
}

// Only the five base colors come from the browser (hex only); the rest are
// derived here, so nothing but plain colors ever reaches the page's CSS.
export async function saveTheme(input: ThemeBase & { id?: string }): Promise<Theme> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 40 || !BASE_KEYS.every((k) => HEX.test(input[k]))) throw new Error("Invalid theme");
  const theme = deriveTheme({ ...input, name });
  // Presets are excluded by the database policy, so editing one returns no rows.
  const [saved] =
    typeof input.id === "string" && SAFE_ID.test(input.id)
      ? await write<Theme>("PATCH", `themes?id=eq.${input.id}`, theme)
      : await write<Theme>("POST", "themes", { ...theme, id: randomUUID() });
  if (!saved) throw new Error("Preset themes can't be edited");
  return saved;
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
