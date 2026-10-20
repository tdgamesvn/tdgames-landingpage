-- MBTI do HR nhập (loại + link kết quả) và đánh giá bài test của Leader.
-- AI đọc cả hai khi chấm hồ sơ / soạn câu hỏi / phân tích sau PV.
--
-- test_review: {verdict: 'pass'|'consider'|'fail', score: 1-10, comment, reviewer, reviewed_at}
-- Một bản duy nhất (hiện chỉ có 1 Leader) — chấm lại thì ghi đè.

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS mbti_type text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS mbti_url text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_review jsonb;
