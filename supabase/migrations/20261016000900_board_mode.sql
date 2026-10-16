-- Board mode: the site can be a free-form board instead of the grid.
-- Cards get a board position (x, y in 56px cells; null = not placed yet, the
-- app auto-places it). Zones are named areas of the board. Settings remember
-- the mode and the last zone. All additive.

alter table public.tiles
  add column x int,
  add column y int;

create table public.zones (
  id text primary key,
  name text not null check (char_length(name) between 1 and 40),
  x int not null,
  y int not null,
  w int not null check (w between 2 and 400),
  h int not null check (h between 2 and 400),
  tone text not null default 'accent',
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.zones enable row level security;
create policy "Public read" on public.zones for select to anon, authenticated using (true);
create policy "Owner writes" on public.zones for all to anon, authenticated
  using (public.lawn_is_owner()) with check (public.lawn_is_owner());

-- zone_id is a plain id (no FK) so saving settings never races saving zones.
alter table public.site_settings
  add column mode text not null default 'website',
  add column zone_id text;
