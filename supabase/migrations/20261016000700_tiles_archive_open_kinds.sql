-- Tile types and tones are validated by the app (src/app/actions.ts) instead
-- of check constraints, so a new tile type needs no schema change. Adds
-- `archived`: hidden from the grid, listed in the archive view.
-- Rebuilt as a new table (old one renamed, rows copied) like 000400; the old
-- table is dropped by the cleanup migration.

alter table public.tiles rename to tiles_legacy_kinds;
alter index public.tiles_pkey rename to tiles_legacy_kinds_pkey;
alter index public.tiles_position_idx rename to tiles_legacy_kinds_position_idx;

create table public.tiles (
  id text primary key,
  kind text not null,
  position int not null,
  w int not null default 1 check (w between 1 and 24),
  h int not null default 1 check (h between 1 and 24),
  tone text not null default 'plain',
  archived boolean not null default false,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tiles_position_idx on public.tiles (position);

alter table public.tiles enable row level security;
create policy "Public read" on public.tiles for select to anon, authenticated using (true);
create policy "Owner writes" on public.tiles for all to anon, authenticated
  using (public.lawn_is_owner()) with check (public.lawn_is_owner());

insert into public.tiles (id, kind, position, w, h, tone, props, created_at, updated_at)
select id, kind, position, w, h, tone, props, created_at, updated_at
from public.tiles_legacy_kinds;
