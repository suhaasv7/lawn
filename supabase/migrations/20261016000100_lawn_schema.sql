-- lawn: tiles, themes, site settings.
-- Anyone can read (RLS select policies). There are no write policies, so the
-- public key can't write; writes go through the owner-checked lawn_* functions
-- (20261016000400_lawn_write_functions).

-- ── Tables ──────────────────────────────────────────────────────────────

-- Grid tiles in display order. Websites are rows with kind = 'link'
-- (props: url, title, note, image). Other kinds keep their fields in props too.
create table public.tiles (
  id text primary key,
  kind text not null check (kind in ('intro', 'link', 'note', 'list', 'clock')),
  position int not null,
  w int not null default 1 check (w between 1 and 6),
  h int not null default 1 check (h between 1 and 8),
  tone text not null default 'plain'
    check (tone in ('plain', 'accent', 'violet', 'blue', 'green', 'amber', 'rose')),
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tiles_position_idx on public.tiles (position);

-- Theme palettes as CSS color values. Presets ship with the site and are
-- read-only; custom themes are created from Theme Center.
create table public.themes (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(name) between 1 and 40),
  is_preset boolean not null default false,
  bg text not null,
  surface text not null,
  raised text not null,
  line text not null,
  line_strong text not null,
  fg text not null,
  muted text not null,
  faint text not null,
  accent text not null,
  glow_1 text not null,
  glow_2 text not null,
  created_at timestamptz not null default now()
);

-- One row: the theme, font and corner radius the site uses.
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  theme_id text references public.themes (id) on delete set null,
  font text not null default 'cascadia',
  radius int not null default 0 check (radius between 0 and 28),
  updated_at timestamptz not null default now()
);

-- ── Access: public read, no direct writes ───────────────────────────────

alter table public.tiles enable row level security;
alter table public.themes enable row level security;
alter table public.site_settings enable row level security;

create policy "Public read" on public.tiles for select to anon, authenticated using (true);
create policy "Public read" on public.themes for select to anon, authenticated using (true);
create policy "Public read" on public.site_settings for select to anon, authenticated using (true);

-- ── Owner secret: only a sha256 is stored (see the lawn_owner_key migration) ──

create schema if not exists private;

create table private.owner (
  id int primary key default 1 check (id = 1),
  secret_sha256 text not null
);
alter table private.owner enable row level security;
