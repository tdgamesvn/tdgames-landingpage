-- Interview sessions: bộ câu hỏi PV do AI sinh + ghi âm + phân tích sau PV.
-- Tách bảng riêng (không nhét cột vào `applications`) vì 1 ứng viên có nhiều
-- vòng: HR screening → chuyên môn → gặp sếp. Mỗi vòng có câu hỏi + audio + đánh giá riêng.
--
-- Toàn bộ truy cập đi qua service role (src/lib/supabase-admin.ts) → bật RLS,
-- không tạo policy nào. Service role bypass RLS; anon/authenticated bị chặn sạch.

CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,

  round               smallint NOT NULL DEFAULT 1,
  title               text,

  -- {generated_at, model, groups:[{topic, questions:[{q, why, green_flag, red_flag}]}]}
  questions           jsonb,

  -- Ghi âm cuộc PV (R2). audio_key giữ lại để sau xoá được object.
  audio_url           text,
  audio_key           text,
  audio_bytes         bigint,

  transcript          text,
  -- 'gemini' | 'whisper' | 'manual' — biết transcript ở đâu ra để soi khi sai
  transcript_source   text,

  -- {analyzed_at, model, score, verdict, fit_confirmed, summary,
  --  evidence[], red_flags[], follow_ups[], score_delta_reason}
  evaluation          jsonb,
  score               smallint,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interview_sessions_application_idx
  ON public.interview_sessions (application_id, round);

CREATE OR REPLACE FUNCTION public.set_interview_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_interview_sessions_updated_at ON public.interview_sessions;
CREATE TRIGGER set_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_interview_sessions_updated_at();

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
