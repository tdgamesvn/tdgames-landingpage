-- Hồ sơ New khi job chưa ưu tiên / đã tuyển đủ (sếp duyệt 2026-10-30):
-- 1) 2 loại mail gửi tay: 'on_hold' (Hồ sơ đang được xem xét) + 'position_filled' (Vị trí đã tuyển đủ)
--    → thêm vào CHECK kind của candidate_emails (lịch sử mail) và hr_email_templates (mẫu sửa được).
-- 2) Trạng thái "Lưu hồ sơ" (talent_pool, nhóm lost) — đích của thao tác "Báo đã tuyển đủ" hàng loạt.

ALTER TABLE public.candidate_emails DROP CONSTRAINT IF EXISTS candidate_emails_kind_check;
ALTER TABLE public.candidate_emails ADD CONSTRAINT candidate_emails_kind_check CHECK (kind IN (
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received', 'on_hold', 'position_filled'
));

ALTER TABLE public.hr_email_templates DROP CONSTRAINT IF EXISTS hr_email_templates_kind_check;
ALTER TABLE public.hr_email_templates ADD CONSTRAINT hr_email_templates_kind_check CHECK (kind IN (
  'interview_invite', 'interview_reschedule', 'interview_cancel',
  'test_assignment', 'rejection', 'offer', 'application_received', 'on_hold', 'position_filled'
));

insert into public.application_statuses (key, label, color, position, kind, remind_days, is_system) values
  ('talent_pool', 'Lưu hồ sơ', 'teal', 75, 'lost', null, false)
on conflict (key) do nothing;
