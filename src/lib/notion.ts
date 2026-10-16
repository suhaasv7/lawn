// Notion as the backup destination (server-only), over Notion's REST API with
// plain fetch. Needs an internal integration token (NOTION_TOKEN) that has
// been given access to one page ("lawn backups"). Under that page we keep three
// inline databases: "lawn snapshots" (each row holds a full JSON copy of the
// site), and "lawn cards" / "lawn zones" (a readable mirror of the board).
import { createHash } from "node:crypto";
import type { Zone } from "@/tiles";
import type { Settings, Theme } from "@/theme";

const TOKEN = process.env.NOTION_TOKEN;
export const notionConfigured = Boolean(TOKEN);

export type TileRow = {
  id: string;
  kind: string;
  position: number;
  w: number;
  h: number;
  tone: string;
  archived: boolean;
  x: number | null;
  y: number | null;
  props: Record<string, unknown>;
};
export type BackupData = {
  version: 1;
  taken: string;
  tiles: TileRow[];
  zones: Zone[];
  themes: Theme[]; // custom themes only (presets ship with the site)
  settings: Settings;
};
export type Snapshot = { id: string; url: string; name: string; taken: string; trigger: string; cards: number };
type Dbs = { snapshots: string; cards: string; zones: string };

type RichText = { plain_text: string }[];
type Paged<T> = { results: T[]; has_more: boolean; next_cursor: string | null };
type PageObj = { id: string; url: string; properties: Record<string, { rich_text?: RichText; title?: RichText; date?: { start: string } | null; select?: { name: string } | null; number?: number | null }> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const text = (s: string) => [{ type: "text", text: { content: s.slice(0, 2000) } }];
const plain = (rt?: RichText) => rt?.map((r) => r.plain_text).join("") ?? "";

async function notion<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.notion.com/v1/${path}`, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    // Rate limited (≈3 requests/s): wait as told and retry.
    if (res.status === 429 && attempt < 4) {
      await sleep(Number(res.headers.get("retry-after") ?? 1) * 1000);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 404) {
      throw new Error("Notion can't see the backups page: open it → ••• → Connections → add your integration (or check NOTION_BACKUP_PAGE_ID).");
    }
    if (!res.ok) throw new Error(`Notion ${res.status}: ${data.message ?? res.statusText}`);
    return data as T;
  }
}

async function every<T>(page: (cursor?: string) => Promise<Paged<T>>): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  do {
    const r = await page(cursor);
    out.push(...r.results);
    cursor = r.has_more ? (r.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return out;
}

const SCHEMAS = {
  "lawn snapshots": {
    Name: { title: {} },
    Taken: { date: {} },
    Trigger: { select: { options: [] } },
    Cards: { number: {} },
    Zones: { number: {} },
    Themes: { number: {} },
  },
  "lawn cards": {
    Name: { title: {} },
    Kind: { select: { options: [] } },
    URL: { url: {} },
    Size: { rich_text: {} },
    Zone: { rich_text: {} },
    Archived: { checkbox: {} },
    Position: { number: {} },
    Content: { rich_text: {} },
    "Card ID": { rich_text: {} },
    Hash: { rich_text: {} },
  },
  "lawn zones": {
    Name: { title: {} },
    Area: { rich_text: {} },
    "Zone ID": { rich_text: {} },
    Hash: { rich_text: {} },
  },
};

// The page backups live under: NOTION_BACKUP_PAGE_ID, or else the page shared
// with the integration (via search, which can lag a minute after sharing).
async function backupPage(): Promise<string> {
  if (process.env.NOTION_BACKUP_PAGE_ID) return process.env.NOTION_BACKUP_PAGE_ID;
  type P = { id: string; parent: { type: string } };
  const r = await notion<Paged<P>>("search", "POST", { filter: { property: "object", value: "page" }, page_size: 100 });
  const page = r.results.find((p) => p.parent.type !== "database_id");
  if (!page) {
    throw new Error("Notion: no page is shared with the integration yet — open your backups page → ••• → Connections → add it (can take a minute to show up).");
  }
  return page.id;
}

// The three databases, created under the backup page on first use. Found by
// listing the page's children (immediate — search lags behind new content).
async function databases(): Promise<Dbs> {
  type Block = { id: string; type: string; child_database?: { title: string } };
  const root = await backupPage();
  const kids = await every((c) =>
    notion<Paged<Block>>(`blocks/${root}/children?page_size=100${c ? `&start_cursor=${c}` : ""}`)
  );
  const existing = new Map(kids.filter((k) => k.type === "child_database").map((k) => [k.child_database!.title, k.id]));
  const ensure = async (title: keyof typeof SCHEMAS) =>
    existing.get(title) ??
    (
      await notion<{ id: string }>("databases", "POST", {
        parent: { type: "page_id", page_id: root },
        title: text(title),
        is_inline: true,
        properties: SCHEMAS[title],
      })
    ).id;
  return { snapshots: await ensure("lawn snapshots"), cards: await ensure("lawn cards"), zones: await ensure("lawn zones") };
}

const snapshotOf = (p: PageObj): Snapshot => ({
  id: p.id,
  url: p.url,
  name: plain(p.properties.Name?.title),
  taken: p.properties.Taken?.date?.start ?? "",
  trigger: p.properties.Trigger?.select?.name ?? "",
  cards: p.properties.Cards?.number ?? 0,
});

export async function listSnapshots(limit = 20): Promise<Snapshot[]> {
  const dbs = await databases();
  const r = await notion<Paged<PageObj>>(`databases/${dbs.snapshots}/query`, "POST", {
    page_size: limit,
    sorts: [{ property: "Taken", direction: "descending" }],
  });
  return r.results.map(snapshotOf);
}

// Each snapshot is a row whose page body is the JSON, split into code blocks
// (Notion caps a text run at 2000 chars and a block at 100 runs).
async function writeSnapshot(dbs: Dbs, data: BackupData, trigger: string): Promise<Snapshot> {
  const json = JSON.stringify(data);
  if (json.length > 400_000) throw new Error("Backup too large for one Notion page");
  const runs = json.match(/[\s\S]{1,1900}/g) ?? ["{}"];
  const children = [];
  for (let i = 0; i < runs.length; i += 100) {
    children.push({
      object: "block",
      type: "code",
      code: { language: "json", rich_text: runs.slice(i, i + 100).map((c) => ({ type: "text", text: { content: c } })) },
    });
  }
  const stamp = new Date(data.taken).toISOString().slice(0, 16).replace("T", " ");
  const page = await notion<PageObj>("pages", "POST", {
    parent: { database_id: dbs.snapshots },
    properties: {
      Name: { title: text(`lawn backup · ${stamp} UTC`) },
      Taken: { date: { start: data.taken } },
      Trigger: { select: { name: trigger } },
      Cards: { number: data.tiles.length },
      Zones: { number: data.zones.length },
      Themes: { number: data.themes.length },
    },
    children,
  });
  return snapshotOf(page);
}

export async function readSnapshot(pageId: string): Promise<BackupData> {
  type Block = { type: string; code?: { rich_text: RichText } };
  const blocks = await every((c) =>
    notion<Paged<Block>>(`blocks/${pageId}/children?page_size=100${c ? `&start_cursor=${c}` : ""}`)
  );
  const data = JSON.parse(blocks.filter((b) => b.type === "code").map((b) => plain(b.code?.rich_text)).join(""));
  if (data?.version !== 1 || !Array.isArray(data.tiles)) throw new Error("That page isn't a lawn backup");
  return data as BackupData;
}

// Mirror: one row per card / zone, matched by id. Rows are only rewritten when
// their content changed (Hash), and rows for deleted cards/zones are archived.
async function sync(db: string, keyProp: string, items: { key: string; props: Record<string, unknown> }[]) {
  const rows = await every((c) => notion<Paged<PageObj>>(`databases/${db}/query`, "POST", { page_size: 100, ...(c && { start_cursor: c }) }));
  const existing = new Map(rows.map((r) => [plain(r.properties[keyProp]?.rich_text), { id: r.id, hash: plain(r.properties.Hash?.rich_text) }]));
  for (const it of items) {
    const hash = createHash("sha1").update(JSON.stringify(it.props)).digest("hex").slice(0, 16);
    const properties = { ...it.props, [keyProp]: { rich_text: text(it.key) }, Hash: { rich_text: text(hash) } };
    const row = existing.get(it.key);
    existing.delete(it.key);
    if (row?.hash === hash) continue;
    if (row) await notion(`pages/${row.id}`, "PATCH", { properties });
    else await notion("pages", "POST", { parent: { database_id: db }, properties });
  }
  for (const gone of existing.values()) await notion(`pages/${gone.id}`, "PATCH", { archived: true });
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const inside = (t: TileRow, z: Zone) =>
  t.x != null && t.y != null && t.x >= z.x && t.y >= z.y && t.x + t.w <= z.x + z.w && t.y + t.h <= z.y + z.h;

function cardRow(t: TileRow, zones: Zone[]) {
  const p = t.props;
  const items = Array.isArray(p.items) ? (p.items as unknown[]) : [];
  const content =
    t.kind === "todo"
      ? items.map((i) => (typeof i === "object" && i ? `${(i as { done?: boolean }).done ? "☑" : "☐"} ${str((i as { text?: unknown }).text)}` : "")).join("\n")
      : t.kind === "list"
        ? items.map(str).join("\n")
        : str(p.text) || str(p.blurb) || str(p.note);
  const url = str(p.url);
  return {
    Name: { title: text(str(p.title) || str(p.name) || str(p.label) || t.kind) },
    Kind: { select: { name: t.kind } },
    URL: { url: /^https?:\/\//.test(url) ? url : null },
    Size: { rich_text: text(`${t.w}×${t.h}`) },
    Zone: { rich_text: text(zones.find((z) => inside(t, z))?.name ?? "") },
    Archived: { checkbox: t.archived },
    Position: { number: t.position ?? null },
    Content: { rich_text: text(content) },
  };
}

// Writes a snapshot (unless the last one is younger than minGapMs) and refreshes the mirror.
export async function backupToNotion(
  data: BackupData,
  trigger: "daily" | "manual",
  minGapMs: number
): Promise<{ skipped: true; last: string } | { skipped: false; snapshot: Snapshot }> {
  const dbs = await databases();
  const [latest] = (
    await notion<Paged<PageObj>>(`databases/${dbs.snapshots}/query`, "POST", {
      page_size: 1,
      sorts: [{ property: "Taken", direction: "descending" }],
    })
  ).results.map(snapshotOf);
  if (latest?.taken && Date.now() - Date.parse(latest.taken) < minGapMs) return { skipped: true, last: latest.taken };
  const snapshot = await writeSnapshot(dbs, data, trigger);
  await sync(dbs.cards, "Card ID", data.tiles.map((t) => ({ key: t.id, props: cardRow(t, data.zones) })));
  await sync(
    dbs.zones,
    "Zone ID",
    data.zones.map((z) => ({ key: z.id, props: { Name: { title: text(z.name) }, Area: { rich_text: text(`${z.w}×${z.h} at ${z.x},${z.y}`) } } }))
  );
  return { skipped: false, snapshot };
}
