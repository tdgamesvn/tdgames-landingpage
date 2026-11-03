-- Ứng viên trùng / nộp lại (spec docs/superpowers/specs/2026-11-03-hr-duplicate-candidate-design.md).
-- Chạy lại an toàn (if not exists / drop if exists).

-- 1. Khoá so trùng — luật chuẩn hoá phải khớp normalizeEmail / normalizePhone ở src/lib/hr-duplicates.ts.
alter table public.applications
  add column if not exists email_norm text generated always as (nullif(lower(btrim(email)), '')) stored;

alter table public.applications
  add column if not exists phone_norm text generated always as (
    case
      when length(regexp_replace(coalesce(phone, ''), '\D', '', 'g')) < 9 then null
      when regexp_replace(phone, '\D', '', 'g') ~ '^84\d{9}$'
        then '0' || substr(regexp_replace(phone, '\D', '', 'g'), 3)
      else regexp_replace(phone, '\D', '', 'g')
    end
  ) stored;

create index if not exists applications_email_norm_idx on public.applications (email_norm);
create index if not exists applications_phone_norm_idx on public.applications (phone_norm);

-- 2. Thời điểm đổi status (mốc "ngày trượt").
alter table public.applications add column if not exists status_changed_at timestamptz;

create or replace function public.applications_touch_status_changed_at() returns trigger
language plpgsql as $$
begin
  new.status_changed_at := now();
  return new;
end $$;

drop trigger if exists applications_status_changed_at on public.applications;
create trigger applications_status_changed_at
  before update of status on public.applications
  for each row when (old.status is distinct from new.status)
  execute function public.applications_touch_status_changed_at();

-- Backfill hồ sơ đang rejected: ngày gửi mail rejection gần nhất, không có → ngày nộp.
update public.applications a
set status_changed_at = coalesce(
  (select max(e.created_at) from public.candidate_emails e where e.application_id = a.id and e.kind = 'rejection'),
  a.created_at
)
where a.status = 'rejected' and a.status_changed_at is null;

-- 3. Đánh dấu trùng + quyền giới thiệu.
alter table public.applications
  add column if not exists duplicate_of uuid references public.applications(id) on delete set null;
alter table public.applications add column if not exists duplicate_kind text;
alter table public.applications drop constraint if exists applications_duplicate_kind_check;
alter table public.applications add constraint applications_duplicate_kind_check
  check (duplicate_kind is null or duplicate_kind in ('auto_rejected', 'open_duplicate', 'returning'));
alter table public.applications add column if not exists referred_by_submitted text;
alter table public.applications add column if not exists referrer_notified_at timestamptz;
alter table public.applications add column if not exists referrer_notified_by text;

-- 4. Loại mail mới.
alter table public.candidate_emails drop constraint if exists candidate_emails_kind_check;
alter table public.candidate_emails add constraint candidate_emails_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection'
]));
alter table public.hr_email_templates drop constraint if exists hr_email_templates_kind_check;
alter table public.hr_email_templates add constraint hr_email_templates_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection'
]));

-- Mỗi hồ sơ tối đa 1 mail duplicate_rejection (đặt chỗ trước khi gửi, như auto-ack).
create unique index if not exists candidate_emails_dup_reject_idx
  on public.candidate_emails (application_id) where kind = 'duplicate_rejection';
