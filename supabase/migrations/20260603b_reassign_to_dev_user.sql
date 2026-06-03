-- Make previously-created data visible in single-user (login-free) mode.
--
-- Before going login-free, rows were saved under your real auth user id.
-- The app now reads/writes everything under the fixed DEV_USER_ID, so any
-- older rows under a different user_id won't appear. This migration moves all
-- existing rows onto the dev user so your past vocab, phrases, writing, and
-- progress load again.
--
-- Safe to run once, after 20260603_single_user_mode.sql.
-- DEV_USER_ID must match src/lib/constants.ts.

do $$
declare
  dev_id uuid := 'a0000000-0000-0000-0000-000000000001';
begin
  update daily_progress    set user_id = dev_id where user_id <> dev_id;
  update vocab_cards        set user_id = dev_id where user_id <> dev_id;
  update writing_entries    set user_id = dev_id where user_id <> dev_id;
  update drill_sessions     set user_id = dev_id where user_id <> dev_id;
  update speaking_sessions  set user_id = dev_id where user_id <> dev_id;
  update phrase_bank        set user_id = dev_id where user_id <> dev_id;
end $$;
