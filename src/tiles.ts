// Tile types and the default grid. The live grid is stored in Supabase
// (public.tiles); these defaults are the fallback when the database isn't
// reachable and what "Reset" restores.
// w/h are in grid cells: a cell is a fixed 56px square with a 12px gap.

export const KINDS = ["intro", "bookmark", "website", "note", "todo", "list", "clock"] as const;
export type Kind = (typeof KINDS)[number];

// "accent" follows the active theme; "plain" has no tint.
export const TONES = ["plain", "accent", "violet", "blue", "green", "amber", "rose"] as const;
export type Tone = (typeof TONES)[number];

export const MAX_SPAN = 24;

// Smallest size each type still reads well at, in cells [w, h]. A bookmark is
// just an icon, so one cell is enough; a website needs room for its preview.
export const MIN_SIZE: Record<Kind, [number, number]> = {
  intro: [6, 5],
  bookmark: [1, 1],
  website: [3, 3],
  note: [2, 2],
  todo: [3, 3],
  list: [3, 2],
  clock: [3, 2],
};

// Size a newly added tile starts at.
export const ADD_SIZE = { bookmark: [1, 1], website: [4, 4], note: [4, 3], todo: [4, 4] } as const;

// archived: hidden from the grid, listed in the archive view.
type Base = { id: string; tone: Tone; w: number; h: number; archived?: boolean };
// embed: whether the site allows being shown in an iframe (checked when added;
// false falls back to a screenshot). image: optional custom preview.
// view: website preview at desktop width (default) or the site's mobile layout.
// scroll: where the preview was last scrolled to, in the site's own pixels.
// frame: website shown with border, header and title (default: full-bleed,
// controls appear when you hover the top edge).
type Link = {
  url: string;
  title: string;
  note?: string;
  image?: string;
  embed?: boolean;
  view?: "desktop" | "mobile";
  scroll?: number;
  frame?: boolean;
};

export type Tile =
  | (Base & { kind: "intro"; name: string; blurb: string })
  | (Base & { kind: "bookmark" } & Link)
  | (Base & { kind: "website" } & Link)
  | (Base & { kind: "note"; label: string; text: string }) // free text you type in edit mode
  | (Base & { kind: "todo"; label: string; items: { text: string; done: boolean }[] })
  | (Base & { kind: "list"; label: string; items: string[] })
  | (Base & { kind: "clock"; label: string; timeZone: string });

export const SITE_NAME = "suhaas";

export const TILES: Tile[] = [
  {
    id: "intro",
    kind: "intro",
    w: 9,
    h: 6,
    tone: "accent",
    name: SITE_NAME,
    blurb:
      "this is my lawn — a small patch of the internet where i keep things i make, links i like, and whatever else i feel like planting.",
  },
  {
    id: "fits",
    kind: "website",
    w: 6,
    h: 6,
    tone: "rose",
    url: "https://fits.sv7.space/",
    title: "fits",
    note: "wardrobe lookbook — log pieces, build outfits",
  },
  {
    id: "now",
    kind: "list",
    w: 3,
    h: 3,
    tone: "amber",
    label: "now",
    items: ["building fits", "making this site mine"],
  },
  {
    id: "clock",
    kind: "clock",
    w: 3,
    h: 3,
    tone: "green",
    label: "local time",
    timeZone: "Asia/Kolkata",
  },
  {
    id: "notes",
    kind: "note",
    w: 9,
    h: 3,
    tone: "plain",
    label: "notes",
    text: "short thoughts, quotes and half-ideas will live here.",
  },
  {
    id: "github",
    kind: "bookmark",
    w: 3,
    h: 3,
    tone: "blue",
    url: "https://github.com/suhaasv7",
    title: "github",
    note: "code & experiments",
  },
  {
    id: "colophon",
    kind: "note",
    w: 6,
    h: 3,
    tone: "plain",
    label: "colophon",
    text: "built with next.js + supabase + swapy.",
  },
];
