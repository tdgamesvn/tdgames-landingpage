-- Tiêu chí loại cứng khi xếp hạng (sếp đặt, áp cho mọi job): vi phạm → blocked,
-- đẩy xuống cuối bảng kèm lý do thay vì chỉ trừ điểm.
ALTER TABLE public.job_ranking_entries ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.job_ranking_entries ADD COLUMN IF NOT EXISTS block_reason text;
INSERT INTO public.app_settings (key, value, updated_at)
VALUES ('hr_ranking_rules', E'Không tuyển người nước ngoài\nPhải sống hoặc làm việc được tại Hà Nội (onsite)', now())
ON CONFLICT (key) DO NOTHING;
