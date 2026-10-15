// Theme Center options. Colors live in app/globals.css under [data-theme="…"];
// fonts are loaded in app/layout.tsx as --font-<id>. Saved per browser for now.

export const THEMES = [
  { id: "midnight", name: "Midnight" },
  { id: "carbon", name: "Carbon" },
  { id: "terminal", name: "Terminal" },
  { id: "abyss", name: "Abyss" },
  { id: "ember", name: "Ember" },
  { id: "rose", name: "Rosé" },
] as const;

export const FONTS = [
  { id: "cascadia", name: "Cascadia Code" },
  { id: "jetbrains", name: "JetBrains Mono" },
  { id: "geist-mono", name: "Geist Mono" },
  { id: "geist", name: "Geist" },
  { id: "inter", name: "Inter" },
] as const;

export const MAX_RADIUS = 28;
export const THEME_KEY = "lawn_theme_v1";

export type ThemeSettings = { theme: string; font: string; radius: number };

export const DEFAULT_THEME: ThemeSettings = { theme: "midnight", font: "cascadia", radius: 0 };

export function parseTheme(raw: unknown): ThemeSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<ThemeSettings>;
  return {
    theme: THEMES.some((t) => t.id === r.theme) ? r.theme! : DEFAULT_THEME.theme,
    font: FONTS.some((f) => f.id === r.font) ? r.font! : DEFAULT_THEME.font,
    radius: Math.min(MAX_RADIUS, Math.max(0, Number(r.radius) || 0)),
  };
}

export function applyTheme(s: ThemeSettings) {
  const el = document.documentElement;
  el.dataset.theme = s.theme;
  el.dataset.font = s.font;
  el.style.setProperty("--t-radius", `${s.radius}px`);
}

// Inlined in <head> so a saved theme is applied before first paint (no flash).
// Mirrors applyTheme; keep the two in sync.
export const THEME_SCRIPT = `try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_KEY)}));if(s){var d=document.documentElement;d.dataset.theme=String(s.theme);d.dataset.font=String(s.font);d.style.setProperty("--t-radius",Math.min(${MAX_RADIUS},Math.max(0,Number(s.radius)||0))+"px")}}catch(e){}`;
