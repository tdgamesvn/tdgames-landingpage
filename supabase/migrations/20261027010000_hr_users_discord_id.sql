-- ID Discord của tài khoản /hr (snowflake) để tag <@id> trong thông báo Discord.
ALTER TABLE public.hr_users
  ADD COLUMN IF NOT EXISTS discord_user_id text CHECK (discord_user_id ~ '^[0-9]{17,20}$');
