-- Lịch phỏng vấn cho từng vòng PV: giờ hẹn + hình thức (offline/online).
-- Online bắt buộc có link Google Meet. Offline → online đổi được bất cứ lúc nào.
-- reminded_at = lúc đã gửi nhắc Discord trước giờ PV; đổi giờ/hình thức/link → reset về null
-- để lần cron sau nhắc lại với thông tin mới.

ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS mode text;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS meet_url text;
ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS reminded_at timestamptz;

ALTER TABLE public.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_mode_check;
ALTER TABLE public.interview_sessions ADD CONSTRAINT interview_sessions_mode_check
  CHECK (mode IS NULL OR mode IN ('offline', 'online'));

ALTER TABLE public.interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_online_meet_check;
ALTER TABLE public.interview_sessions ADD CONSTRAINT interview_sessions_online_meet_check
  CHECK (mode IS DISTINCT FROM 'online' OR (meet_url IS NOT NULL AND meet_url <> ''));

CREATE INDEX IF NOT EXISTS interview_sessions_scheduled_idx
  ON public.interview_sessions (scheduled_at)
  WHERE scheduled_at IS NOT NULL;
