# lawn

Personal bento-grid site — Next.js (App Router) + Tailwind v4 + Swapy, data in Supabase, deployed on Vercel.

- Default tiles: `src/tiles.ts` · grid UI: `src/components/Bento.tsx` · theme model: `src/theme.ts`
- Server: `src/lib/` (Supabase REST, owner cookie) · writes: `src/app/actions.ts`
- `npm run dev` · `npm run build` · `npm run lint`

## Grid

Cells are fixed 56px squares (12px gap); tiles are `w`×`h` cells. Each tile type
has a minimum size (`MIN_SIZE` in `src/tiles.ts`) — a bookmark can be one cell,
a website needs 3×3 for its preview (a live iframe when the site allows framing,
a screenshot otherwise).

## Supabase

Schema and data changes are migrations in `supabase/migrations/` (`<timestamp>_<name>.sql`).
The Supabase GitHub integration (Project Settings → Integrations → GitHub, "Deploy to
production" on `main`) applies new ones on every push to `main`.
Add a table or rows = add a new migration file; never edit one that already ran.

Tables are public-read. Writes need the `x-lawn-secret` header (the server's
`LAWN_WRITE_SECRET`); RLS "Owner writes" policies check it against a sha256 in
`private.owner`, so the public key alone can't write.

## Env (Vercel + `.env.local`)

| Name | What |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` key |
| `LAWN_WRITE_SECRET` | Server-only; its sha256 is in `private.owner` |
| `NOTION_TOKEN` | Notion internal integration secret — enables backups (daily + "Back up now") to the "lawn backups" page |

Without these the site shows the defaults from code, read-only.
