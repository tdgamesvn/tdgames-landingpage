-- Onboard người mới: checklist theo hồ sơ (ngày đi làm dùng lại dữ liệu offer/hoa hồng).
create table if not exists public.hr_onboarding (
  application_id uuid primary key references public.applications(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  reminded jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chỉ service role đọc/ghi (như các bảng /hr khác).
alter table public.hr_onboarding enable row level security;
