-- Thời gian dự kiến nộp bài test: ứng viên tự chọn trên /test/<token> TRƯỚC khi
-- được nộp bài (chọn 1 lần, muốn đổi → HR). test_eta_set_at = lúc ứng viên xác nhận.
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_eta timestamptz;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_eta_set_at timestamptz;
