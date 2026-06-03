-- Single-user (login-free) mode
-- The app runs without auth and uses a fixed DEV_USER_ID. This migration:
--   1. Removes the auth.users foreign keys so the fixed dev user can write rows
--   2. Disables RLS and grants table access to the anon role (anon key, no session)
--   3. Adds the new `listening` activity column to daily_progress
--
-- Run this once in the Supabase SQL editor.

-- 1. Drop auth.users foreign keys (constraint names use the default <table>_user_id_fkey)
alter table daily_progress    drop constraint if exists daily_progress_user_id_fkey;
alter table vocab_cards       drop constraint if exists vocab_cards_user_id_fkey;
alter table writing_entries   drop constraint if exists writing_entries_user_id_fkey;
alter table drill_sessions    drop constraint if exists drill_sessions_user_id_fkey;
alter table speaking_sessions drop constraint if exists speaking_sessions_user_id_fkey;
alter table phrase_bank       drop constraint if exists phrase_bank_user_id_fkey;

-- 2. Disable RLS and grant access to the anon role (the client uses the anon key with no session)
alter table daily_progress    disable row level security;
alter table vocab_cards       disable row level security;
alter table writing_entries   disable row level security;
alter table drill_sessions    disable row level security;
alter table speaking_sessions disable row level security;
alter table phrase_bank       disable row level security;

grant select, insert, update, delete on daily_progress    to anon;
grant select, insert, update, delete on vocab_cards       to anon;
grant select, insert, update, delete on writing_entries   to anon;
grant select, insert, update, delete on drill_sessions    to anon;
grant select, insert, update, delete on speaking_sessions to anon;
grant select, insert, update, delete on phrase_bank       to anon;

-- 3. New Listening activity column for the daily ritual
alter table daily_progress add column if not exists listening boolean not null default false;
