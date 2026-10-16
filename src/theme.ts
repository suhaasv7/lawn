// Theme model shared by server and client. Themes and the active settings live
// in Supabase (themes, site_settings); DEFAULT_THEME/DEFAULT_SETTINGS are the
// fallback when the database isn't reachable. Each color becomes a --t-* CSS
// variable that Tailwind tokens read (see app/globals.css).

export const FONTS = [
  { id: "cascadia", name: "Cascadia Code" },
  { id: "jetbrains", name: "JetBrains Mono" },
  { id: "geist-mono", name: "Geist Mono" },
  { id: "geist", name: "Geist" },
  { id: "inter", name: "Inter" },
] as const;

export const MAX_RADIUS = 28;

export const COLOR_KEYS = [
  "bg",
  "surface",
  "raised",
  "line",
  "line_strong",
  "fg",
  "muted",
  "faint",
  "accent",
  "glow_1",
  "glow_2",
] as const;
type ColorKey = (typeof COLOR_KEYS)[number];

export type Theme = { id: string; name: string; is_preset: boolean } & Record<ColorKey, string>;
// mode: grid ("website") or free-form board; zone_id: last zone viewed on the board.
export type Settings = {
  theme_id: string | null;
  font: string;
  radius: number;
  mode: "website" | "board";
  zone_id: string | null;
};

// The colors you pick in Theme Center; the rest are derived from these.
export const BASE_KEYS = ["bg", "surface", "fg", "muted", "accent"] as const;
export const BASE_LABELS: Record<(typeof BASE_KEYS)[number], string> = {
  bg: "Background",
  surface: "Tiles",
  fg: "Text",
  muted: "Muted text",
  accent: "Accent",
};
export type ThemeBase = { name: string } & Record<(typeof BASE_KEYS)[number], string>;

export const HEX = /^#[0-9a-f]{6}$/i;

export const DEFAULT_THEME: Theme = {
  id: "midnight",
  name: "Midnight",
  is_preset: true,
  bg: "#09090b",
  surface: "#111114",
  raised: "#19191d",
  line: "rgb(255 255 255 / 0.08)",
  line_strong: "rgb(255 255 255 / 0.16)",
  fg: "#fafafa",
  muted: "#a1a1aa",
  faint: "#6b6b74",
  accent: "#8b5cf6",
  glow_1: "rgb(139 92 246 / 0.18)",
  glow_2: "rgb(59 130 246 / 0.12)",
};

export const DEFAULT_LOOK = { theme_id: "midnight", font: "cascadia", radius: 0 } as const;
export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_LOOK, mode: "website", zone_id: null };

export function deriveTheme(b: ThemeBase): Omit<Theme, "id" | "is_preset"> {
  return {
    name: b.name,
    bg: b.bg,
    surface: b.surface,
    fg: b.fg,
    muted: b.muted,
    accent: b.accent,
    raised: `color-mix(in oklab, ${b.surface}, ${b.fg} 5%)`,
    line: `color-mix(in oklab, ${b.fg} 9%, transparent)`,
    line_strong: `color-mix(in oklab, ${b.fg} 18%, transparent)`,
    faint: `color-mix(in oklab, ${b.muted}, ${b.bg} 40%)`,
    glow_1: `color-mix(in oklab, ${b.accent} 18%, transparent)`,
    glow_2: `color-mix(in oklab, ${b.accent} 9%, transparent)`,
  };
}

export function colorVars(theme: Pick<Theme, ColorKey>): Record<string, string> {
  return Object.fromEntries(COLOR_KEYS.map((k) => [`--t-${k.replace("_", "-")}`, theme[k]]));
}

export function themeVars(theme: Pick<Theme, ColorKey>, settings: Settings): Record<string, string> {
  const font = FONTS.some((f) => f.id === settings.font) ? settings.font : DEFAULT_SETTINGS.font;
  return { ...colorVars(theme), "--t-radius": `${settings.radius}px`, "--t-font": `var(--font-${font})` };
}

export function applyVars(vars: Record<string, string>) {
  for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
}
