// Everything on the grid lives here. Add a tile = add an object.
// Order below is the default layout; visitors' rearrangements are saved locally
// and new tiles get appended to the end of a saved layout.

export type Size = "sm" | "wide" | "tall" | "lg"; // 1x1, 2x1, 1x2, 2x2
export type Tone = "paper" | "red" | "blue" | "green" | "dark";

type Base = { id: string; size: Size; tone: Tone };

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
    size: "lg",
    tone: "paper",
    name: SITE_NAME,
    blurb:
      "this is my lawn — a small patch of the internet where i keep things i make, links i like, and whatever else i feel like planting.",
  },
  {
    id: "fits",
    kind: "link",
    size: "tall",
    tone: "red",
    url: "https://fits.sv7.space/",
    title: "fits",
    note: "wardrobe lookbook — log pieces, build outfits",
  },
  {
    id: "now",
    kind: "list",
    size: "sm",
    tone: "dark",
    label: "now",
    items: ["building fits", "making this site mine"],
  },
  {
    id: "clock",
    kind: "clock",
    size: "sm",
    tone: "green",
    label: "local time",
    timeZone: "Asia/Kolkata",
  },
  {
    id: "notes",
    kind: "note",
    size: "wide",
    tone: "dark",
    label: "notes",
    text: "short thoughts, quotes and half-ideas will live here.",
  },
  {
    id: "github",
    kind: "link",
    size: "sm",
    tone: "blue",
    url: "https://github.com/suhaasv7",
    title: "github",
    note: "code & experiments",
  },
  {
    id: "colophon",
    kind: "note",
    size: "sm",
    tone: "paper",
    label: "colophon",
    text: "react · swapy · cascadia code. hit edit to rearrange.",
  },
];
