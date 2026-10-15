-- Grid cells go from ~190px to a fixed 56px square, and 'link' splits into
-- 'bookmark' (icon, can shrink to one cell) and 'website' (live preview, needs
-- room). Minimum sizes per type are enforced by the app.
-- Rebuilt as a new table (old one renamed, rows copied over) rather than
-- altered in place; the old table is dropped by a later cleanup migration.

alter table public.tiles rename to tiles_legacy;
alter index public.tiles_pkey rename to tiles_legacy_pkey;
alter index public.tiles_position_idx rename to tiles_legacy_position_idx;

create table public.tiles (
  id text primary key,
  kind text not null check (kind in ('intro', 'bookmark', 'website', 'note', 'list', 'clock')),
  position int not null,
  w int not null default 1 check (w between 1 and 24),
  h int not null default 1 check (h between 1 and 24),
  tone text not null default 'plain'
    check (tone in ('plain', 'accent', 'violet', 'blue', 'green', 'amber', 'rose')),
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tiles_position_idx on public.tiles (position);

alter table public.tiles enable row level security;
create policy "Public read" on public.tiles for select to anon, authenticated using (true);

-- Old 1x1 links were icon tiles; the rest showed a preview. One old cell is
-- about three 56px cells (3×56 + 2×12 gap = 192px), so sizes ×3 keep every
-- tile's footprint.
insert into public.tiles (id, kind, position, w, h, tone, props, created_at, updated_at)
select id,
       case when kind <> 'link' then kind when w = 1 and h = 1 then 'bookmark' else 'website' end,
       position, w * 3, h * 3, tone, props, created_at, updated_at
from public.tiles_legacy;
