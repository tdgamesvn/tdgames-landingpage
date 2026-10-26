-- Mail HR đã gửi cho ứng viên từ /hr (qua Resend, hr@tdgamestudio.com).
-- to_email = email ứng viên; sent_to = địa chỉ thực nhận (chế độ test → hộp nội bộ).
-- Chỉ ghi khi Resend nhận mail (2xx). Chỉ service role đọc/ghi (RLS bật, không policy).

CREATE TABLE IF NOT EXISTS public.candidate_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_id uuid REFERENCES public.interview_sessions(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'interview_invite', 'interview_reschedule', 'interview_cancel', 'test_assignment', 'rejection'
  )),
  to_email text NOT NULL,
  sent_to text NOT NULL,
  test_mode boolean NOT NULL,
  subject text NOT NULL,
  body_text text NOT NULL,
  body_html text NOT NULL,
  resend_id text,
  sent_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidate_emails_app_idx
  ON public.candidate_emails (application_id, created_at DESC);

ALTER TABLE public.candidate_emails ENABLE ROW LEVEL SECURITY;
