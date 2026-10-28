-- Mail "Cảm ơn ứng tuyển" tự động khi ứng viên nộp form: thêm loại 'application_received'
-- vào CHECK kind của candidate_emails (lịch sử mail) và hr_email_templates (mẫu sửa được).
-- Bật/tắt tự động: app_settings key 'hr_auto_ack' (giá trị 'off' = tắt; không có dòng = bật).

ALTER TABLE public.candidate_emails DROP CONSTRAINT IF EXISTS candidate_emails_kind_check;
ALTER TABLE public.candidate_emails ADD CONSTRAINT candidate_emails_kind_check CHECK (kind IN (
  'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection', 'offer',
  'application_received'
));

ALTER TABLE public.hr_email_templates DROP CONSTRAINT IF EXISTS hr_email_templates_kind_check;
ALTER TABLE public.hr_email_templates ADD CONSTRAINT hr_email_templates_kind_check CHECK (kind IN (
  'interview_invite', 'interview_reschedule', 'interview_cancel',
  'test_assignment', 'rejection', 'offer', 'application_received'
));
