-- Ghi âm PV ngay trong app /hr: 1 vòng PV = nhiều mảnh (recorder tự chốt file mỗi 5 phút,
-- bị ngắt thì ghi tiếp thành đoạn mới). Mảng có thứ tự:
--   [{segment, key, url, bytes, mime, duration_ms, created_at}]
-- null = vòng cũ, dùng audio_url/audio_key/audio_bytes (upload file tay) như trước.
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS audio_pieces jsonb;

COMMENT ON COLUMN public.interview_sessions.audio_pieces IS
  'Ghi âm trong app: [{segment,key,url,bytes,mime,duration_ms,created_at}]. null = dùng audio_url cũ.';
