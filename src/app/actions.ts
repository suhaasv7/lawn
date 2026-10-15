"use server";

// Every export here is callable from the browser, so each one checks the owner
// cookie and validates its input before touching Supabase.
import { cookies } from "next/headers";
import { rpc } from "@/lib/db";
import { OWNER_COOKIE, isOwner, ownerToken, safeEqual } from "@/lib/owner";
import { KINDS, TONES, Tile } from "@/tiles";
import { BASE_KEYS, FONTS, HEX, MAX_RADIUS, Settings, Theme, ThemeBase, deriveTheme } from "@/theme";

async function ownerSecret() {
  if (!(await isOwner())) throw new Error("Locked — unlock editing first.");
  return process.env.LAWN_WRITE_SECRET!;
}

export async function unlock(passphrase: string): Promise<boolean> {
  const expected = process.env.OWNER_PASSPHRASE;
  const token = ownerToken();
  if (!expected || !token || typeof passphrase !== "string" || !safeEqual(passphrase, expected)) return false;
  (await cookies()).set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return true;
}

export async function lock() {
  (await cookies()).delete(OWNER_COOKIE);
}

const isHttpUrl = (u: unknown) => {
  try {
    return typeof u === "string" && /^https?:$/.test(new URL(u).protocol);
  } catch {
    return false;
  }
};

export async function saveTiles(tiles: Tile[]) {
  const secret = await ownerSecret();
  if (!Array.isArray(tiles) || tiles.length > 200) throw new Error("Invalid tiles");
  const seen = new Set<string>();
  const payload = tiles.map((t) => {
    const { id, kind, w, h, tone, ...props } = t;
    const ok =
      typeof id === "string" &&
      id.length > 0 &&
      id.length <= 64 &&
      !seen.has(id) &&
      KINDS.includes(kind) &&
      TONES.includes(tone) &&
      Number.isInteger(w) &&
      w >= 1 &&
      w <= 6 &&
      Number.isInteger(h) &&
      h >= 1 &&
      h <= 8 &&
      (kind !== "link" || isHttpUrl((t as { url?: unknown }).url)) &&
      JSON.stringify(props).length <= 4000;
    if (!ok) throw new Error(`Invalid tile: ${String(id)}`);
    seen.add(id);
    return { id, kind, w, h, tone, props };
  });
  await rpc("lawn_save_tiles", { secret, payload });
}

export async function saveSettings(s: Settings) {
  const secret = await ownerSecret();
  const ok =
    (s.theme_id === null || typeof s.theme_id === "string") &&
    FONTS.some((f) => f.id === s.font) &&
    Number.isInteger(s.radius) &&
    s.radius >= 0 &&
    s.radius <= MAX_RADIUS;
  if (!ok) throw new Error("Invalid settings");
  await rpc("lawn_save_settings", { secret, p_theme_id: s.theme_id, p_font: s.font, p_radius: s.radius });
}

// Only the five base colors come from the browser (hex only); the rest are
// derived here, so nothing but plain colors ever reaches the page's CSS.
export async function saveTheme(input: ThemeBase & { id?: string }): Promise<Theme> {
  const secret = await ownerSecret();
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 40 || !BASE_KEYS.every((k) => HEX.test(input[k]))) throw new Error("Invalid theme");
  const theme = deriveTheme({ ...input, name });
  const id = await rpc<string | null>("lawn_upsert_theme", {
    secret,
    theme: { ...theme, id: typeof input.id === "string" ? input.id : undefined },
  });
  if (!id) throw new Error("Preset themes can't be edited");
  return { ...theme, id, is_preset: false };
}

export async function deleteTheme(id: string) {
  const secret = await ownerSecret();
  if (typeof id !== "string") throw new Error("Invalid theme id");
  await rpc("lawn_delete_theme", { secret, p_id: id });
}
