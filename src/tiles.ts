// Default grid. The live grid is stored in Supabase (public.tiles); these are
// the fallback when the database isn't reachable and what "Reset" restores.
// w/h are in grid cells; a cell is a square (6 columns on desktop, 4 tablet, 2 phone).

export const KINDS = ["intro", "link", "note", "list", "clock"] as const;
// "accent" follows the active theme; "plain" has no tint.
export const TONES = ["plain", "accent", "violet", "blue", "green", "amber", "rose"] as const;
export type Tone = (typeof TONES)[number];

type Base = { id: string; tone: Tone; w: number; h: number };

export type Tile =
  | (Base & { kind: "intro"; name: string; blurb: string })
  | (Base & { kind: "link"; url: string; title: string; note?: string; image?: string })
  | (Base & { kind: "note"; label: string; text: string })
  | (Base & { kind: "list"; label: string; items: string[] })
  | (Base & { kind: "clock"; label: string; timeZone: string });

export const SITE_NAME = "suhaas";

export const TILES: Tile[] = [
  {
    id: "intro",
    kind: "intro",
    w: 3,
    h: 2,
    tone: "accent",
    name: SITE_NAME,
    blurb:
      "this is my lawn — a small patch of the internet where i keep things i make, links i like, and whatever else i feel like planting.",
  },
  {
    id: "fits",
    kind: "link",
    w: 2,
    h: 2,
    tone: "rose",
    url: "https://fits.sv7.space/",
    title: "fits",
    note: "wardrobe lookbook — log pieces, build outfits",
  },
  {
    id: "now",
    kind: "list",
    w: 1,
    h: 1,
    tone: "amber",
    label: "now",
    items: ["building fits", "making this site mine"],
  },
  {
    id: "clock",
    kind: "clock",
    w: 1,
    h: 1,
    tone: "green",
    label: "local time",
    timeZone: "Asia/Kolkata",
  },
  {
    id: "notes",
    kind: "note",
    w: 3,
    h: 1,
    tone: "plain",
    label: "notes",
    text: "short thoughts, quotes and half-ideas will live here.",
  },
  {
    id: "github",
    kind: "link",
    w: 1,
    h: 1,
    tone: "blue",
    url: "https://github.com/suhaasv7",
    title: "github",
    note: "code & experiments",
  },
  {
    id: "colophon",
    kind: "note",
    w: 2,
    h: 1,
    tone: "plain",
    label: "colophon",
    text: "built with next.js + supabase + swapy.",
  },
];
