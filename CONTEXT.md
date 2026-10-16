# lawn — project context

Single source of truth for picking this project up in a new session. **Read this
first; update it at the end of every task** (what changed, why, what's pending).
Secrets are never written here — they live in `.env.local` (gitignored) and Vercel.

Last updated: 2026-10-16

---

## 1. What this is

`lawn` is Suhaas's personal site: a dark, terminal-flavoured bento grid of cards
(links/bookmarks, live website previews, notes, to-dos, clock, intro…) that he
edits directly on the page. **Single user — there are no visitors to design for
and no login.** Live at **https://lawn.sv7.space** (also cosmos-wheat.vercel.app).

Repo: `github.com/suhaasv7/lawn` (public; formerly `cosmos`). Local path:
`~/Documents/personal/lawn`. Sibling project `fits` (`fits.sv7.space`, wardrobe
lookbook app) lives next to it and appears as a website card.

## 2. How to work here (owner's standing preferences)

- **Push every change straight to `main`** (commit + push, no asking). Vercel
  auto-deploys `main` to production in ~40s.
- **Commit identity**: repos under `~/Documents/personal` commit as
  `Suhaas V <suhaasvijay7@gmail.com>` (GitHub `suhaasv7`) via
  `[includeIf "gitdir:~/Documents/personal/"] path = ~/.gitconfig-personal` in
  `~/.gitconfig`. Everything else on this laptop uses the work identity — don't change that.
- **Pushing**: remotes embed a suhaasv7 token (see `~/Documents/personal/CLAUDE.md`);
  plain `git push origin main` works. Never print the token.
- **Don't add features/flows that weren't asked for** (an unrequested passphrase
  gate was built once and the owner was annoyed). Mention risks in one line instead.
- **Design taste**: dark only; sharp corners by default (radius 0); terminal mono
  font (Cascadia Code default); "super modern / fresh"; restrained colour.
  All styling goes through Tailwind tokens backed by theme CSS variables.
- **Replies**: short. The owner often says "tldr".
- **Verify before shipping**: build + lint + a real-browser check. Don't test
  writes against the live DB while the owner is using it — use the local PGlite
  fake (§8). A pre-existing `npm run lint` is clean.
- **Database changes are migrations** in `supabase/migrations/` — see §5 for the
  connector limitation and the rename-and-copy pattern.

## 3. Stack & infrastructure

| Piece | Details |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 (PostCSS, `@theme` tokens), Swapy (grid drag), Hugeicons |
| Hosting | Vercel project `lawn` (`prj_01P4dfH5AW43IraB1tPlC5KLjhke`), team `suhaasvijay's projects` (`team_SEmue22W9j5MV05WZVzVukq4`). `vercel.json` pins `framework: nextjs` (project was created as Vite) and `regions: ["hnd1"]` (Tokyo, next to the DB). Domain `lawn.sv7.space` via Cloudflare → Vercel. |
| Database | Supabase project **"Lawn"**, ref `rqdkxgtoccuvuxqkyxzf`, region ap-northeast-1 (Tokyo), Postgres 17. Accessed server-side only over REST with plain `fetch` (no supabase-js). |
| Env vars (Vercel + `.env.local`) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), `LAWN_WRITE_SECRET` (server-only; sha256 stored in `private.owner`). Backups: `NOTION_TOKEN` (Notion internal integration secret, `ntn_…`) — optional `NOTION_BACKUP_PAGE_ID`, optional `CRON_SECRET`. `OWNER_PASSPHRASE` and `VITE_GOOGLE_CLIENT_ID` are obsolete and can be deleted from Vercel. |
| Notion | Backup destination: a page in the owner's Notion workspace (the one the `NOTION_TOKEN` connection belongs to), connected to the integration. Note: the Notion MCP available to Claude is connected to a **different workspace** — a "lawn backups" page created there via MCP (id `3fb92f02…`) is NOT the backup page and can be deleted. |
| MCP | Supabase MCP added at local scope for `~/Documents/personal` (read-only calls work; destructive SQL is auto-declined — §5). Vercel MCP returns 403 for this team's project/env endpoints (needs re-auth to that scope); there's no Vercel CLI. |
| Fonts | next/font: Cascadia Code (default, preloaded), JetBrains Mono, Geist Mono, Geist, Inter (not preloaded). |

## 4. Code map

```
src/app/layout.tsx      fonts; reads site data; renders active theme as inline --t-* vars on <html>; force-dynamic
src/app/page.tsx        reads site data → <Bento editable=…/>
src/app/actions.ts      server actions: saveTiles, saveZones, saveSettings, saveTheme (upsert), deleteTheme, canEmbed, listBackups, backupNow, restoreBackup (all validate input)
src/app/api/backup/route.ts  daily backup endpoint for Vercel Cron (vercel.json `crons`: 20:30 UTC ≈ 02:00 IST)
src/app/globals.css     theme vars + @theme tokens, tile utility, 56px grid + container-query columns, edit-mode cells, swapy styles
src/lib/db.ts           REST helpers: select(), write() (adds x-lawn-secret header)
src/lib/site.ts         getSiteData(): tiles/zones/themes/settings per request; falls back to code defaults (read-only) if DB fails
src/lib/backup.ts       collect() all data straight from Supabase (never the fallback) + runBackup()
src/lib/notion.ts       Notion REST client (plain fetch, API 2022-06-28): databases under the backup page, snapshots, mirror, read/list
src/tiles.ts            tile kinds, tones, MIN_SIZE / ADD_SIZE, Tile type, default TILES (fallback + "Reset")
src/theme.ts            Theme/Settings types, FONTS, DEFAULT_THEME/SETTINGS, deriveTheme (5 base colours → full palette), themeVars
src/components/Bento.tsx  the app shell: nav (mode switch, zone bar), grid (Swapy), Add / Archive / Theme Center dialogs, autosave
src/components/cards.tsx  every card kind (TileCard, WebsiteTile, TodoTile…), TileControls (edit overlay), shared class sets/helpers
src/components/Board.tsx  board mode: camera (pan/zoom/pinch), free card drag/resize, zones, placeMissing()
src/components/BrandIcons.tsx  GithubIcon
supabase/migrations/    SQL history (see §5)
supabase/config.toml    from `supabase init` (for the GitHub integration, which isn't enabled)
```

## 5. Data model (Supabase)

**Tables (public schema, RLS on):**
- `tiles` — `id text pk, kind text, position int, w int (1–24), h int (1–24), tone text, archived bool, x int, y int, props jsonb, created_at, updated_at`.
  `position` = order in the grid; `x, y` = cell position on the board (null until first placed).
- `zones` — `id, name, x, y, w, h (cells, 2–400), tone, position, created_at` (board areas).
  Kind/tone are **validated in the app, not the DB** (since 000700), so new tile
  types need no schema change. Kind-specific fields live in `props`.
- `themes` — `id, name, is_preset, bg, surface, raised, line, line_strong, fg, muted, faint, accent, glow_1, glow_2, created_at`. 6 presets (midnight, carbon, terminal, abyss, ember, rose) are read-only.
- `site_settings` — single row `id=1`: `theme_id, font, radius, mode ('website'|'board'), zone_id (last zone; plain text, no FK), updated_at`.
- `private.owner` — `secret_sha256` (hash of `LAWN_WRITE_SECRET`).
- Retired, still present: `tiles_legacy`, `tiles_legacy_kinds` (dropped by pending 000800).

**Access:** policy "Public read" (select) on tiles/zones/themes/site_settings; policy "Owner writes"
(`for all`) using `public.lawn_is_owner()`, which checks the request's
`x-lawn-secret` header (`current_setting('request.headers')`) against
`private.owner`. Presets are excluded from writes. The publishable key alone is
read-only; all writes go through `src/app/actions.ts` (server) with the secret.

**Migrations** (`supabase/migrations/`, recorded in `supabase_migrations.schema_migrations`):

| Version | What | Applied live? |
| --- | --- | --- |
| 000100 lawn_schema | tables, read policies, private.owner | yes |
| 000200 lawn_seed | presets, settings row, default tiles | yes |
| 000300 lawn_owner_key | sha256 of LAWN_WRITE_SECRET (safe to commit: 32 random bytes) | yes |
| 000400 tile_types_56px_cells | rebuild `tiles`: link → bookmark/website, sizes ×3 for 56px cells | yes |
| 000500 lawn_owner_writes | `lawn_is_owner()` + "Owner writes" policies | yes |
| 000700 tiles_archive_open_kinds | rebuild `tiles`: + `archived`, no kind/tone checks | yes |
| 000800 drop_legacy | drop retired tables + old trading-template function/trigger | **no** (destructive) |
| 000900 board_mode | tiles.x/y, zones table + policies, site_settings.mode/zone_id | yes |

**Connector limitation (important):** in this environment the Supabase MCP
auto-declines anything destructive (`drop`, `update`/`delete` — even inside
function bodies — and some `revoke`s). Non-destructive SQL works (`create`,
`alter … add/rename`, `insert`, policies). So schema changes that would need a
drop are done by **rename old table → create new → `insert … select`**, then
recorded with `insert into supabase_migrations.schema_migrations`. The Supabase
GitHub integration (auto-apply migrations on push) was proposed but the owner
hasn't enabled it. Validate SQL locally in PGlite before applying (§8). Note
`postgres` doesn't own `auth.users`: drop auth triggers via `drop function … cascade`.

## 6. Features (current behaviour)

- **Grid ("website mode")**: fixed 56px square cells, 12px gap, full screen width
  (no max-width). Column count via container queries: 4 on small phones up to 40.
  Cards span w×h cells; wider than the screen clamps. `grid-auto-flow: dense`.
- **Edit mode** (Edit/Done): drag to swap cards (Swapy, `manualSwap` so React owns
  the DOM, `swapMode: drop`), resize from the corner handle or arrow keys in 56px
  steps (down to each kind's minimum), archive (top-left), delete (top-right),
  size badge, faint 1px cell outlines + 3 spare rows behind the grid.
- **Card kinds** (`MIN_SIZE`): intro 6×5, bookmark 1×1 (icon; name when ≥2 wide),
  website 3×3, note 2×2, todo 3×3, list 3×2, clock 3×2.
- **Add dialog**: Bookmark (starts 1×1), Website (4×4; server checks if it can be
  iframed — `canEmbed` reads X-Frame-Options/CSP), Note (4×3, opens edit mode to
  type), To-do (4×4).
- **Website cards**: live iframe; full-bleed by default (1px edge; controls slide
  in when hovering the top edge), frame toggle for bordered header+title layout;
  desktop view (1280px scaled into the card) by default, mobile toggle;
  **look-only (no scroll/click) unless the cursor "interact" toggle is on** — then
  the site gets a real card-sized window. Sites that refuse framing show a
  microlink screenshot. No scroll saving (browsers don't expose cross-origin scroll).
- **Notes**: typed in edit mode, shown as text. **To-dos**: tick/add/delete any time; label in edit mode.
- **Archive**: archived cards leave the grid; the Archive button opens a
  near-fullscreen modal showing the real cards with Restore / Delete.
- **Theme Center** (popover): 6 presets + custom themes (pick 5 colours, rest
  derived server-side, live preview), font (5), corner radius 0–28px.
  Everything visual uses Tailwind tokens (`bg-surface`, `text-muted`,
  `border-line`, `rounded-theme`, …) backed by `--t-*` variables.
- **Board mode** (Website/Board switch in the nav; mode is saved): the whole site
  is one canvas. Scroll/drag empty space to pan; pinch or ctrl+scroll to zoom
  (free, 10%–250%). Cards keep their own board position (`x, y`), separate from
  the grid order; cards never placed get auto-placed first-fit in a 24-cell band.
  Edit mode: drag cards anywhere (dashed outline shows where it will land),
  resize, faint cell outlines. **Cards never overlap**: a drop lands on the
  nearest free spot (`nearestFree`, ring search), resizing (drag or arrow keys)
  stops at the first card in the way, and new / restored / zone-moved cards are
  placed on the nearest free spot. **Zones** are invisible outside edit mode
  (no outline, no label). In edit mode: "Assign zone" (only shown while
  editing) shows the cells; drag a rectangle (≥2×2, live W×H label) — scroll or
  hold Space+drag to move around while assigning, Esc cancels; it becomes
  "Zone N" with its name focused. Still in edit mode you can drag a zone by its
  label (cards fully inside move with it), resize from its corner, rename,
  delete (cards stay). **Nav**: a Zones dropdown (only zone names, no "All");
  picking one pans so the zone's centre is mid-screen, keeping the current
  zoom. The last zone (and mode) is saved; the board reopens centred on it at 100%.
- **Backups → Notion** ("Backup" button in the nav opens the Backups dialog):
  daily via Vercel Cron (`/api/backup`, skipped if the last snapshot is <12h
  old; if `CRON_SECRET` is set only Vercel's call is accepted) and "Back up
  now" (skipped if <1 min). Under the "lawn backups" page the code creates
  three inline databases: **lawn snapshots** (one row per backup; the page body
  is the full JSON — tiles, zones, custom themes, settings — split into code
  blocks), **lawn cards** and **lawn zones** (readable mirror, one row per item
  keyed by id; only changed rows are rewritten, removed items archived).
  **Restore** (from the dialog) reads a snapshot and replaces cards, zones,
  custom themes and settings through the normal validated saves, then reloads.
  Root page = `NOTION_BACKUP_PAGE_ID`, else the first page shared with the
  integration (search; can lag a minute after sharing). The three databases are
  found by listing the root page's children (no search lag). Without
  `NOTION_TOKEN` the dialog shows the setup steps.
- **Saving**: autosave ~600ms after changes (tiles, zones, settings), status in nav
  (Saving…/Saved/Couldn't save). If the DB is unreachable the site shows code
  defaults read-only (so defaults can never overwrite real data).

## 7. Decisions & history (why things are the way they are)

- Started (Feb 2025) as a Vite/React "law firm" bento template; re-themed to a
  personal site on 2026-10-16. Law content, Google sign-in, ticker, and parchment
  (light) cards were all removed.
- Swapy was causing React DOM desync → switched to `manualSwap` + `flushSync`.
- Migrated Vite → Next.js 16 to get server code for Supabase without a separate backend.
- Grid evolved: 6/4/2 big cells → fixed 56px cells → full width, up to 40 columns.
- **Removed on request**: sign-in, owner passphrase/unlock, saved website scroll
  position, tall-page iframe trick (broke app-like sites in interact mode).
- Supabase: owner asked to drop the old trading-template tables (done by him in
  the dashboard); manual SQL/token steps were rejected ("everything should happen
  on push") — hence migrations + connector, see §5.
- Edit-mode cell pattern was toned down from filled squares to faint outlines.

## 8. Testing

- `npm run build`, `npx eslint .` — both must be clean.
- Browser checks with Playwright using the installed Chrome (`channel: "chrome"`,
  headless). Playwright lives at `~/.claude/skills/gstack/node_modules/playwright`.
- **Local fake Supabase**: PGlite (`@electric-sql/pglite`, installed in a scratch
  dir, not the repo) loads every migration, then a tiny Node HTTP server mimics
  PostgREST on `:54321` and enforces RLS (runs as `anon`, sets `request.headers`
  from `x-lawn-secret`). Run the app with `SUPABASE_URL=http://localhost:54321 npx next start`.
  The scripts were session-local; recreate from this description if needed.
- **Mock Notion**: a preload (`NODE_OPTIONS="--import mock.mjs"` on `next start`)
  patches `fetch` for `api.notion.com` with an in-memory Notion that rejects
  payloads real Notion would (unknown/mistyped properties, >2000-char runs,
  >100 blocks). Used to test backup / mirror / throttle / restore.

## 9. Changelog (newest first)

- 2026-10-16 backups to Notion: daily cron + "Back up now", snapshots (full JSON) + cards/zones mirror, restore from the Backups dialog; saveTheme is now an upsert
- 2026-10-16 board: zones hidden outside edit mode; nav zone chips/"All" → Zones dropdown that pans to the zone's centre (zoom kept); Assign zone only while editing; Space+drag pans while assigning; reload centres last zone at 100%
- 2026-10-16 board: "Assign zone" (drag a cell rectangle to create a zone); cards can no longer overlap (nearest-free drop/placement, resize stops at neighbours)
- 2026-10-16 board mode: canvas with pan/zoom, free card placement, zones, Website/Board switch, last zone remembered (migration 000900); card code split into `cards.tsx`
- `bb2adfa` CONTEXT.md + CLAUDE.md added
- 2026-10-16 `7942c10` edit-mode cells → faint outlines
- `cf1e293` website previews only scroll in interact mode; saved scroll removed
- `fbda9c2` interact mode gets a real window; edit-mode cell grid; archive modal shows real cards
- `1f191bd` notes, to-dos, archive, full-bleed websites, full width (migration 000700)
- `b773056` 56px grid, bookmark/website kinds, iframe previews, saving via RLS header, passphrase removed (000400/000500)
- `90fa518`…`4c855ba` migration plumbing (GitHub-integration attempt, split migrations)
- `a55a104` Supabase storage (tiles/themes/settings), server actions
- `3916778` modern dark refresh + Theme Center
- `2157344` Vite → Next.js 16, sign-in removed
- `f5cfe2b` square cells, resize, Add website
- `0ef5757` personal-site retheme, data-driven tiles, link previews
- `d056ff0` Edit toggle; Swapy/React desync fix
- `134d0e9` build fix (lockfile, GoogleLogin locale)

## 10. Open items / known limits

- **Backups need the owner's one-time Notion setup**: create an internal
  integration, connect it to the "lawn backups" page, add `NOTION_TOKEN` to
  Vercel and redeploy. Until then the Backups dialog shows those steps.
- Migration 000800 (cleanup) not applied — harmless; needs the GitHub
  integration or a manual run.
- Grid mode: dragging swaps cards; cards can't be dropped into empty space
  (board mode allows free placement).
- Board: zones all use the accent tone (owner is fine with that for now).
- Anyone who opens the site can edit (by design — single user, no login).
- Website previews of sites that block framing (GitHub, Vercel…) fall back to a
  screenshot (microlink free tier, ~50/day per IP).

## 11. In progress

Nothing in progress. Board mode shipped (see §6) per the owner's decisions:
whole site as a board with a switch back to website mode, free zoom, and it
reopens on the last zone (single user, no visitors).
