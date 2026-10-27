-- Mẫu mail ứng viên HR sửa được (tab "Mẫu mail" trong /hr). Không có dòng = dùng mẫu mặc định trong code.
-- Chỉ service role đọc/ghi (RLS bật, không policy).

CREATE TABLE IF NOT EXISTS public.hr_email_templates (
  kind text PRIMARY KEY CHECK (kind IN (
    'interview_invite', 'interview_reschedule', 'interview_cancel',
    'test_assignment', 'rejection', 'offer'
  )),
  subject text NOT NULL,
  body text NOT NULL,
  updated_by text,
  updated_by_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.hr_email_templates ENABLE ROW LEVEL SECURITY;
