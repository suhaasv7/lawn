-- Cleanup: leftover tables from an earlier trading-app template (all empty
-- when checked on 2026-10-16) plus the functions/trigger that use them.
-- The on_auth_user_created trigger inserts into public.profiles, so it must go
-- too or auth sign-ups would fail. Migrations run as postgres, which doesn't own
-- auth.users and can't drop the trigger directly; dropping our function with
-- CASCADE removes the trigger along with it.
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
