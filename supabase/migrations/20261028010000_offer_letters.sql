-- Thư mời nhận việc (PDF đính kèm mail offer). Một hồ sơ = một thư (dữ liệu form đã lưu).
-- Có lương → chỉ service role đọc/ghi (RLS bật, không policy). PDF không lưu ở đâu cả:
-- server sinh lại từ `data` (gửi mail) hoặc từ snapshot trong candidate_emails.attachments (xem lại).

CREATE TABLE IF NOT EXISTS public.offer_letters (
  application_id uuid PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  data jsonb NOT NULL,
  updated_by text,
  updated_by_user_id uuid REFERENCES public.hr_users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_letters ENABLE ROW LEVEL SECURITY;

-- File đính kèm của mail đã gửi: [{ filename, kind: "offer_letter", snapshot }].
ALTER TABLE public.candidate_emails
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
