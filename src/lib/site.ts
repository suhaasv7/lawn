import { cache } from "react";
import { TILES, Tile } from "@/tiles";
import { DEFAULT_SETTINGS, DEFAULT_THEME, Settings, Theme } from "@/theme";
import { dbConfigured, select } from "./db";

export type SiteData = { tiles: Tile[]; themes: Theme[]; settings: Settings; live: boolean };

type TileRow = Pick<Tile, "id" | "kind" | "w" | "h" | "tone"> & { props: Record<string, unknown> };

const FALLBACK: SiteData = { tiles: TILES, themes: [DEFAULT_THEME], settings: DEFAULT_SETTINGS, live: false };

// Read once per request (shared by layout and page). If Supabase isn't set up
// or fails, serve the defaults from code with live=false, which also hides the
// editing controls so nothing can overwrite the real data with defaults.
export const getSiteData = cache(async (): Promise<SiteData> => {
  if (!dbConfigured) return FALLBACK;
  try {
    const [rows, themes, settings] = await Promise.all([
      select<TileRow>("tiles", "select=id,kind,w,h,tone,props&order=position"),
      select<Theme>(
        "themes",
        "select=id,name,is_preset,bg,surface,raised,line,line_strong,fg,muted,faint,accent,glow_1,glow_2&order=is_preset.desc,created_at,name"
      ),
      select<Settings>("site_settings", "select=theme_id,font,radius&id=eq.1"),
    ]);
    return {
      tiles: rows.map(({ props, ...row }) => ({ ...props, ...row }) as Tile),
      themes: themes.length ? themes : [DEFAULT_THEME],
      settings: settings[0] ?? DEFAULT_SETTINGS,
      live: true,
    };
  } catch (e) {
    console.error("Supabase read failed; serving defaults", e);
    return FALLBACK;
  }
});

export const activeTheme = (d: Pick<SiteData, "themes" | "settings">) =>
  d.themes.find((t) => t.id === d.settings.theme_id) ?? d.themes[0];
