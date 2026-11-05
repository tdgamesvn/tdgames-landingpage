-- Kho freelancer trên /hr (spec docs/superpowers/specs/2026-11-05-hr-freelancer-pool-design.md).
-- Chỉ thêm (không DROP) — chạy lại an toàn. KHÔNG gửi mail nào.

-- 1. Cột freelancer.
alter table public.applications add column if not exists freelance_stage text not null default 'new';
alter table public.applications add column if not exists freelance_level text;
alter table public.applications add column if not exists rate_vnd_per_hour integer;
alter table public.applications add column if not exists freelance_issue boolean not null default false;
alter table public.applications add column if not exists freelance_job_open boolean;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'applications_freelance_stage_check') then
    alter table public.applications add constraint applications_freelance_stage_check
      check (freelance_stage in ('new', 'talking', 'testing', 'collaborated', 'not_fit'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'applications_freelance_level_check') then
    alter table public.applications add constraint applications_freelance_level_check
      check (freelance_level is null or freelance_level in ('fresher', 'junior', 'middle', 'senior'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'applications_rate_vnd_check') then
    alter table public.applications add constraint applications_rate_vnd_check
      check (rate_vnd_per_hour is null or rate_vnd_per_hour between 10000 and 100000000);
  end if;
end $$;

-- 2. Status 'freelancer' (trước chỉ thêm tay trên prod). Khoá hệ thống để không bị xoá trong Quản lý trạng thái.
insert into public.application_statuses (key, label, color, position, kind, is_system)
values ('freelancer', 'Freelancer', 'indigo', 67, 'open', true)
on conflict (key) do nothing;
update public.application_statuses set is_system = true, remind_days = null where key = 'freelancer';

-- 3. Dữ liệu cũ: đơn HR đã kéo vào cột Freelancer → là freelancer.
update public.applications set work_type = 'freelancer' where status = 'freelancer' and work_type <> 'freelancer';

-- Mọi đơn freelancer → status 'freelancer', stage giữ (mặc định new); job_open = cờ hiện tại của job.
update public.applications a
set status = 'freelancer',
    freelance_job_open = coalesce(j.accepts_freelance, false) or j.type = 'freelancer'
from public.jobs j
where j.id = a.job_id and a.work_type = 'freelancer'
  and (a.status <> 'freelancer' or a.freelance_job_open is null);

-- Rate chữ → số (cùng luật parseRateVnd: chỉ số . , khoảng trắng đ/VND/VNĐ; 10.000–100.000.000).
update public.applications
set rate_vnd_per_hour = nullif(regexp_replace(rate_per_hour, '\D', '', 'g'), '')::bigint
where work_type = 'freelancer' and rate_vnd_per_hour is null
  and rate_per_hour is not null
  and regexp_replace(lower(rate_per_hour), 'vnđ|vnd|đ|[0-9.,[:space:]]', '', 'g') = ''
  and length(regexp_replace(rate_per_hour, '\D', '', 'g')) between 5 and 9
  and regexp_replace(rate_per_hour, '\D', '', 'g')::bigint between 10000 and 100000000;
