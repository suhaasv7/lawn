-- Cleanup: the pre-56px tiles table, plus leftovers of an earlier trading-app
-- template (its tables were dropped by hand on 2026-10-16; the drops below are
-- no-ops then). The on_auth_user_created trigger inserts into the dropped
-- public.profiles, so it has to go too. Migrations run as postgres, which
-- doesn't own auth.users and can't drop the trigger directly; dropping our
-- function with CASCADE removes the trigger along with it.
drop table if exists public.tiles_legacy;
do $$
begin
  drop function if exists public.handle_new_user() cascade;
exception when insufficient_privilege then
  raise notice 'Could not drop public.handle_new_user(): %', sqlerrm;
end $$;
drop function if exists public.execute_trade cascade;
drop table if exists public.transactions cascade;
drop table if exists public.holdings cascade;
drop table if exists public.watchlist cascade;
drop table if exists public.profiles cascade;
