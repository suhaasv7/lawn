-- Optional cleanup: leftover tables from an earlier trading-app template (all
-- empty when checked on 2026-10-16) plus the functions/trigger that use them.
-- The auth trigger inserts into public.profiles, so it must go with that table
-- or new auth sign-ups would fail.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.execute_trade cascade;
drop table if exists public.transactions cascade;
drop table if exists public.holdings cascade;
drop table if exists public.watchlist cascade;
drop table if exists public.profiles cascade;
