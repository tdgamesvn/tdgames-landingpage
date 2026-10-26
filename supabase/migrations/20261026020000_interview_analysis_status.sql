-- Phân tích ghi âm PV chạy nền: gỡ băng 40–50 phút + chấm điểm mất vài phút, vượt trần
-- ~100s của Cloudflare → POST /analyze trả 202 ngay, client hỏi lại trạng thái.
-- analysis_status: null = rảnh/xong, 'running' = đang chạy, 'failed' = lỗi (xem analysis_error).

ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS analysis_status text;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS analysis_error text;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS analysis_started_at timestamptz;

ALTER TABLE public.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_analysis_status_check;
ALTER TABLE public.interview_sessions ADD CONSTRAINT interview_sessions_analysis_status_check
  CHECK (analysis_status IS NULL OR analysis_status IN ('running', 'failed'));
