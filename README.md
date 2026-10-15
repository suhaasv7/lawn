# lawn

Personal bento-grid site — Next.js (App Router) + Tailwind v4 + Swapy, data in Supabase, deployed on Vercel.

- Default tiles: `src/tiles.ts` · grid UI: `src/components/Bento.tsx` · theme model: `src/theme.ts`
- Server: `src/lib/` (Supabase REST, owner cookie) · writes: `src/app/actions.ts`
- `npm run dev` · `npm run build` · `npm run lint`

## Supabase

Run in the SQL editor, in order:

1. `supabase/migrations/20261016000000_drop_legacy_tables.sql` (optional cleanup)
2. `supabase/migrations/20261016000100_lawn_schema.sql`
3. `supabase/migrations/20261016000200_lawn_seed.sql`
4. `supabase/owner.local.sql` (local only — hash of `LAWN_WRITE_SECRET`)

Tables are public-read; writes only go through `lawn_*` functions that check the owner secret.

## Env (Vercel + `.env.local`)

| Name | What |
| --- | --- |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` key |
| `LAWN_WRITE_SECRET` | Server-only; its sha256 is in `private.owner` |
| `OWNER_PASSPHRASE` | Typed on the site (footer lock icon) to unlock editing |

Without these (or before the SQL is run) the site shows the defaults from code, read-only.
