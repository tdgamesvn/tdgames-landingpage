-- Hạn nộp hồ sơ của job (tuỳ chọn). Có giá trị → JSON-LD JobPosting.validThrough (cuối ngày giờ VN).
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_deadline date;
COMMENT ON COLUMN public.jobs.apply_deadline IS 'Hạn nộp hồ sơ (tuỳ chọn). Hiện trên /careers/<slug> + JobPosting.validThrough.';
