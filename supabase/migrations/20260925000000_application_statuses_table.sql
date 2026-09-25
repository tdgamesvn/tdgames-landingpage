-- HR pipeline: status cấu hình được (thêm/bớt/đổi tên/màu/thứ tự) thay cho enum cứng.
-- applications.status: enum application_status → text + FK tới application_statuses.key
-- (ON UPDATE CASCADE để phòng đổi key; UI chỉ cho đổi label nên key thực tế bất biến).

create table if not exists public.application_statuses (
  key          text primary key check (key ~ '^[a-z0-9_]{1,40}$'),
  label        text not null,
  color        text not null default 'slate',   -- key trong palette UI (blue, yellow, ...)
  position     integer not null default 0,
  kind         text not null default 'open' check (kind in ('open', 'won', 'lost')),
  remind_days  integer check (remind_days is null or remind_days > 0), -- null = không nhắc
  is_system    boolean not null default false,  -- new / rejected: không cho xoá
  created_at   timestamptz not null default now()
);

alter table public.application_statuses enable row level security;
-- Không có policy: chỉ service role (API /api/hr/statuses) đọc/ghi.

insert into public.application_statuses (key, label, color, position, kind, remind_days, is_system) values
  ('new',             'New',             'blue',   10, 'open', 2,    true),
  ('reviewing',       'Reviewing',       'yellow', 20, 'open', 7,    false),
  ('phone_screening', 'Phone Screening', 'orange', 30, 'open', 7,    false),
  ('test',            'Test',            'cyan',   40, 'open', null, false),
  ('interview',       'Interview',       'purple', 50, 'open', 14,   false),
  ('offer',           'Offer',           'green',  60, 'won',  null, false),
  ('rejected',        'Rejected',        'red',    70, 'lost', null, true)
on conflict (key) do nothing;

alter table public.applications alter column status drop default;
alter table public.applications alter column status type text using status::text;
alter table public.applications alter column status set default 'new';
alter table public.applications
  add constraint applications_status_fkey
  foreign key (status) references public.application_statuses(key)
  on update cascade on delete restrict;

drop type if exists public.application_status;
