// Collects everything the site stores and backs it up to Notion. Reads the
// database directly (never the code fallback), so a backup only ever holds
// real data.
import { dbConfigured, select } from "./db";
import { BackupData, TileRow, backupToNotion, notionConfigured } from "./notion";
import { DEFAULT_SETTINGS, Settings, Theme } from "@/theme";
import type { Zone } from "@/tiles";

export async function collect(): Promise<BackupData> {
  if (!dbConfigured) throw new Error("Supabase isn't configured");
  const [tiles, zones, themes, settings] = await Promise.all([
    select<TileRow>("tiles", "select=id,kind,position,w,h,tone,archived,x,y,props&order=position"),
    select<Zone>("zones", "select=id,name,x,y,w,h,tone,position&order=position"),
    select<Theme>("themes", "select=id,name,is_preset,bg,surface,raised,line,line_strong,fg,muted,faint,accent,glow_1,glow_2&is_preset=eq.false"),
    select<Settings>("site_settings", "select=theme_id,font,radius,mode,zone_id&id=eq.1"),
  ]);
  return { version: 1, taken: new Date().toISOString(), tiles, zones, themes, settings: { ...DEFAULT_SETTINGS, ...settings[0] } };
}

export async function runBackup(trigger: "daily" | "manual", minGapMs: number) {
  if (!notionConfigured) throw new Error("Notion isn't connected yet (NOTION_TOKEN is missing)");
  return backupToNotion(await collect(), trigger, minGapMs);
}
