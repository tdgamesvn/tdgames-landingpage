-- Xếp hạng ứng viên phù hợp theo job (AI), tiết kiệm token bằng 2 tầng cache:
--
-- 1. Hồ sơ AI của từng application, chia 2 phần tính lại độc lập:
--    ai_profile  — từ CV + portfolio (ảnh) + form. Đắt, chỉ tính lại khi
--                  ai_profile_hash đổi (đổi CV / link / thông tin form).
--    ai_digest   — tóm tắt dữ liệu HR rải rác theo thời gian: Note, comment,
--                  bài test + Leader chấm, kết quả phân tích PV, lý do reject.
--                  Chỉ text → rẻ; tính lại khi ai_digest_hash đổi.
-- 2. job_ranking_entries — điểm của từng ứng viên với từng job. fingerprint =
--    hash hồ sơ + hash digest + hash JD lúc chấm → lệch là "có dữ liệu mới".

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_profile jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_profile_hash text;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_digest jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_digest_hash text;

CREATE TABLE IF NOT EXISTS public.job_rankings (
  job_id uuid PRIMARY KEY REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_hash text,
  model text,
  ranked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_ranking_entries (
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  score smallint NOT NULL,
  tier text NOT NULL,
  reason text,
  fingerprint text NOT NULL,
  counts jsonb,
  scored_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, application_id)
);

ALTER TABLE public.job_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_ranking_entries ENABLE ROW LEVEL SECURITY;
