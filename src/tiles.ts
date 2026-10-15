// Default grid. Add a tile = add an object (or use "+ Add" on the site).
// w/h are in grid cells; a cell is a square (6 columns on desktop, 4 tablet, 2 phone).
// Changes made on the site (move/resize/add/remove) are saved in that browser and
// override this list there; "Reset" brings these defaults back.

// "accent" follows the active Theme Center theme; "plain" has no tint.
export type Tone = "plain" | "accent" | "violet" | "blue" | "green" | "amber" | "rose";

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
    text: "built with next.js + swapy. edit to move & resize, theme to restyle.",
  },
];
