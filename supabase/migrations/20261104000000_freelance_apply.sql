-- Ứng viên chọn hình thức Freelancer (sếp chốt 2026-11-04):
-- job nhận freelancer → status 'freelancer' + mail freelance_received;
-- job chưa nhận → status 'talent_pool' (Lưu hồ sơ) + mail freelance_not_open.
-- Chạy lại an toàn (if not exists / drop if exists).

-- 1. Job có nhận hình thức freelancer không (mặc định chưa).
alter table public.jobs add column if not exists accepts_freelance boolean not null default false;

-- 2. Loại mail mới.
alter table public.candidate_emails drop constraint if exists candidate_emails_kind_check;
alter table public.candidate_emails add constraint candidate_emails_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection',
  'freelance_received', 'freelance_not_open'
]));
alter table public.hr_email_templates drop constraint if exists hr_email_templates_kind_check;
alter table public.hr_email_templates add constraint hr_email_templates_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection',
  'freelance_received', 'freelance_not_open'
]));

-- 3. Mỗi hồ sơ tối đa 1 mail cảm ơn freelancer (đặt chỗ trước khi gửi, như auto-ack).
create unique index if not exists candidate_emails_freelance_ack_idx
  on public.candidate_emails (application_id) where kind in ('freelance_received', 'freelance_not_open');
