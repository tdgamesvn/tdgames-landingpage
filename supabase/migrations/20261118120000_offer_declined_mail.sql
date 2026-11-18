-- Mail "Xác nhận từ chối offer" (sếp yêu cầu 2026-11-18): thêm kind offer_declined vào CHECK
-- của candidate_emails (lịch sử mail) và hr_email_templates (mẫu sửa được). Chạy lại an toàn.
alter table public.candidate_emails drop constraint if exists candidate_emails_kind_check;
alter table public.candidate_emails add constraint candidate_emails_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection',
  'freelance_received', 'freelance_not_open', 'offer_declined'
]));
alter table public.hr_email_templates drop constraint if exists hr_email_templates_kind_check;
alter table public.hr_email_templates add constraint hr_email_templates_kind_check check (kind = any (array[
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled', 'duplicate_rejection',
  'freelance_received', 'freelance_not_open', 'offer_declined'
]));
