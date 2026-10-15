-- lawn: tiles, themes, site settings.
-- Anyone can read. Nobody can write directly: writes go through the lawn_*
-- functions, which require the owner secret (LAWN_WRITE_SECRET, server-only).

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

revoke insert, update, delete, truncate on public.tiles, public.themes, public.site_settings
  from anon, authenticated;

-- ── Owner secret: only a sha256 is stored (see the lawn_owner_key migration) ──

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.owner (
  id int primary key default 1 check (id = 1),
  secret_sha256 text not null
);
alter table private.owner enable row level security;

create function private.assert_owner(secret text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if secret is null or not exists (
    select 1 from private.owner o
    where o.secret_sha256 = encode(sha256(convert_to(secret, 'UTF8')), 'hex')
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
end $$;
revoke all on function private.assert_owner(text) from public, anon, authenticated;

-- ── Write functions ─────────────────────────────────────────────────────

-- Replaces the whole grid: payload is the tiles array in display order.
create function public.lawn_save_tiles(secret text, payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_owner(secret);
  if jsonb_typeof(payload) <> 'array' then
    raise exception 'payload must be an array';
  end if;
  delete from public.tiles t
  where not exists (select 1 from jsonb_array_elements(payload) e where e->>'id' = t.id);
  insert into public.tiles (id, kind, position, w, h, tone, props, updated_at)
  select e->>'id', e->>'kind', (o - 1)::int, (e->>'w')::int, (e->>'h')::int,
         coalesce(e->>'tone', 'plain'), coalesce(e->'props', '{}'::jsonb), now()
  from jsonb_array_elements(payload) with ordinality as x(e, o)
  on conflict (id) do update set
    kind = excluded.kind, position = excluded.position, w = excluded.w, h = excluded.h,
    tone = excluded.tone, props = excluded.props, updated_at = now();
end $$;

create function public.lawn_save_settings(secret text, p_theme_id text, p_font text, p_radius int)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_owner(secret);
  update public.site_settings
  set theme_id = p_theme_id, font = p_font, radius = p_radius, updated_at = now()
  where id = 1;
end $$;

-- Creates or updates a custom theme and returns its id. Presets are skipped
-- (returns null for them).
create function public.lawn_upsert_theme(secret text, theme jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
begin
  perform private.assert_owner(secret);
  insert into public.themes
    (id, name, bg, surface, raised, line, line_strong, fg, muted, faint, accent, glow_1, glow_2)
  values (
    coalesce(theme->>'id', gen_random_uuid()::text), theme->>'name',
    theme->>'bg', theme->>'surface', theme->>'raised', theme->>'line', theme->>'line_strong',
    theme->>'fg', theme->>'muted', theme->>'faint', theme->>'accent', theme->>'glow_1', theme->>'glow_2'
  )
  on conflict (id) do update set
    name = excluded.name, bg = excluded.bg, surface = excluded.surface, raised = excluded.raised,
    line = excluded.line, line_strong = excluded.line_strong, fg = excluded.fg,
    muted = excluded.muted, faint = excluded.faint, accent = excluded.accent,
    glow_1 = excluded.glow_1, glow_2 = excluded.glow_2
  where public.themes.is_preset = false
  returning id into v_id;
  return v_id;
end $$;

create function public.lawn_delete_theme(secret text, p_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_owner(secret);
  delete from public.themes where id = p_id and is_preset = false;
end $$;

revoke all on function public.lawn_save_tiles(text, jsonb) from public;
revoke all on function public.lawn_save_settings(text, text, text, int) from public;
revoke all on function public.lawn_upsert_theme(text, jsonb) from public;
revoke all on function public.lawn_delete_theme(text, text) from public;
grant execute on function public.lawn_save_tiles(text, jsonb) to anon, authenticated;
grant execute on function public.lawn_save_settings(text, text, text, int) to anon, authenticated;
grant execute on function public.lawn_upsert_theme(text, jsonb) to anon, authenticated;
grant execute on function public.lawn_delete_theme(text, text) to anon, authenticated;
