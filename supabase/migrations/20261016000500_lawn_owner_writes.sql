-- Writes: the site's server sends LAWN_WRITE_SECRET (server-only, in Vercel)
-- as an x-lawn-secret header; rows can only be written when its sha256 matches
-- private.owner. The public key alone stays read-only.

create function public.lawn_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from private.owner o
    where o.secret_sha256 = encode(sha256(convert_to(
      coalesce(current_setting('request.headers', true)::json ->> 'x-lawn-secret', ''), 'UTF8')), 'hex')
  )
$$;

create policy "Owner writes" on public.tiles for all to anon, authenticated
  using (public.lawn_is_owner()) with check (public.lawn_is_owner());

create policy "Owner writes" on public.site_settings for all to anon, authenticated
  using (public.lawn_is_owner()) with check (public.lawn_is_owner());

-- Preset themes stay read-only, even for the owner.
create policy "Owner writes" on public.themes for all to anon, authenticated
  using (public.lawn_is_owner() and not is_preset) with check (public.lawn_is_owner() and not is_preset);
