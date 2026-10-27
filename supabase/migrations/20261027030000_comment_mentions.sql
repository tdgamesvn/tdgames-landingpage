-- @tag thành viên trong comment hồ sơ /hr: lưu id hr_users được nhắc.
alter table public.application_comments
  add column if not exists mentions uuid[] not null default '{}';
