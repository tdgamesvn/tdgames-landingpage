-- Hoa hồng giới thiệu (refer): người giới thiệu độc lập, quy tắc theo job, ngày đi làm/nghỉ, các khoản phải trả.
-- RLS bật, không policy: chỉ service role (API /hr) truy cập.

create table if not exists public.referrers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text check (kind in ('internal','external')), -- null = chưa phân loại
  ref_codes text[] not null default '{}',
  hr_user_id uuid unique references public.hr_users(id) on delete set null,
  phone text not null default '',
  email text not null default '',
  bank_info text not null default '',
  note text not null default '',
  active boolean not null default true,
  rule jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_job_rules (
  job_id uuid references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('internal','external')),
  rule jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (job_id, kind)
);

create table if not exists public.referral_placements (
  application_id uuid primary key references public.applications(id) on delete cascade,
  start_date date,
  start_confirmed boolean not null default false,
  left_date date,
  history jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict, -- xoá hồ sơ phải qua API (chặn khi có khoản duyệt/trả)
  referrer_id uuid references public.referrers(id) on delete set null,
  hr_user_id uuid references public.hr_users(id) on delete set null,
  beneficiary_name text not null,
  beneficiary_kind text check (beneficiary_kind in ('internal','external')),
  job_id uuid,
  milestone_months int not null,
  percent int not null,
  amount bigint,
  amount_issue text check (amount_issue in ('no_rule','no_salary')),
  amount_edited boolean not null default false,
  rule_key text,
  rule_snapshot jsonb,
  rule_source text,
  due_date date,
  status text not null default 'upcoming' check (status in ('upcoming','due','approved','paid','cancelled')),
  approved_by text,
  approved_at timestamptz,
  paid_by text,
  paid_date date,
  cancel_reason text,
  note text not null default '',
  edits jsonb not null default '[]',
  due_notified_at timestamptz,
  approved_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists referral_payouts_live_uniq
  on public.referral_payouts (application_id, milestone_months) where status <> 'cancelled';
create index if not exists referral_payouts_status_due_idx on public.referral_payouts (status, due_date);

alter table public.referrers enable row level security;
alter table public.referral_job_rules enable row level security;
alter table public.referral_placements enable row level security;
alter table public.referral_payouts enable row level security;
