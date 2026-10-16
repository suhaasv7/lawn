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
| Env vars (Vercel + `.env.local`) | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), `LAWN_WRITE_SECRET` (server-only; sha256 stored in `private.owner`). `OWNER_PASSPHRASE` and `VITE_GOOGLE_CLIENT_ID` are obsolete and can be deleted from Vercel. |
| MCP | Supabase MCP added at local scope for `~/Documents/personal` (read-only calls work; destructive SQL is auto-declined — §5). Vercel MCP returns 403 for this team's project/env endpoints (needs re-auth to that scope); there's no Vercel CLI. |
| Fonts | next/font: Cascadia Code (default, preloaded), JetBrains Mono, Geist Mono, Geist, Inter (not preloaded). |

## 4. Code map

```
src/app/layout.tsx      fonts; reads site data; renders active theme as inline --t-* vars on <html>; force-dynamic
src/app/page.tsx        reads site data → <Bento editable=…/>
src/app/actions.ts      server actions: saveTiles, saveSettings, saveTheme, deleteTheme, canEmbed (all validate input)
src/app/globals.css     theme vars + @theme tokens, tile utility, 56px grid + container-query columns, edit-mode cells, swapy styles
src/lib/db.ts           REST helpers: select(), write() (adds x-lawn-secret header)
src/lib/site.ts         getSiteData(): tiles/themes/settings per request; falls back to code defaults (read-only) if DB fails
src/tiles.ts            tile kinds, tones, MIN_SIZE / ADD_SIZE, Tile type, default TILES (fallback + "Reset")
src/theme.ts            Theme/Settings types, FONTS, DEFAULT_THEME/SETTINGS, deriveTheme (5 base colours → full palette), themeVars
src/components/Bento.tsx  the app shell: nav, grid (Swapy), Add / Archive / Theme Center dialogs, autosave
src/components/BrandIcons.tsx  GithubIcon
supabase/migrations/    SQL history (see §5)
supabase/config.toml    from `supabase init` (for the GitHub integration, which isn't enabled)
```
(Board mode work in progress adds `src/components/cards.tsx` and `src/components/Board.tsx` — §11.)

## 5. Data model (Supabase)

**Tables (public schema, RLS on):**
- `tiles` — `id text pk, kind text, position int, w int (1–24), h int (1–24), tone text, archived bool, props jsonb, created_at, updated_at`.
  Kind/tone are **validated in the app, not the DB** (since 000700), so new tile
  types need no schema change. Kind-specific fields live in `props`.
- `themes` — `id, name, is_preset, bg, surface, raised, line, line_strong, fg, muted, faint, accent, glow_1, glow_2, created_at`. 6 presets (midnight, carbon, terminal, abyss, ember, rose) are read-only.
- `site_settings` — single row `id=1`: `theme_id, font, radius, updated_at`.
- `private.owner` — `secret_sha256` (hash of `LAWN_WRITE_SECRET`).
- Retired, still present: `tiles_legacy`, `tiles_legacy_kinds` (dropped by pending 000800).

**Access:** policy "Public read" (select) on all three; policy "Owner writes"
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
- **Saving**: autosave ~600ms after changes (tiles, settings), status in nav
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

## 9. Changelog (newest first)

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

- Migration 000800 (cleanup) not applied — harmless; needs the GitHub
  integration or a manual run.
- Grid mode: dragging swaps cards; cards can't be dropped into empty space
  (board mode solves this).
- Anyone who opens the site can edit (by design — single user, no login).
- Website previews of sites that block framing (GitHub, Vercel…) fall back to a
  screenshot (microlink free tier, ~50/day per IP).

## 11. In progress: Board mode (whiteboard)

Owner's decisions (2026-10-16):
1. The **whole site becomes a board**, with a switch back to the current grid ("website mode").
2. **Free zoom** (wheel/pinch) and pan.
3. No visitors — **remember the last zone** (and mode) and open there.

Plan:
- Cards get `x, y` (cells) and can be dropped anywhere, snapped to the 56px grid
  (68px pitch). Cards without a position are auto-placed first-fit.
- **Zones** = named rectangles (`zones` table: id, name, x, y, w, h, tone,
  position). Cards inside a zone move with it. Zone chips in the top bar fly the
  camera to fit that zone.
- `site_settings` gains `mode` ('website' | 'board') and `zone_id` (last zone).
- Additive migration (connector-safe): `alter table … add column` + `create table zones` + policies.
- Code: split card rendering into `src/components/cards.tsx`; new
  `src/components/Board.tsx` (camera transform, pan/zoom/pinch, free drag,
  zones); `Bento.tsx` switches between grid and board.

Status: started — plan above; nothing shipped yet.
