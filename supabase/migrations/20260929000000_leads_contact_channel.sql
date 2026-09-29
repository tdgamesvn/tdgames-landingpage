-- Kênh liên hệ ưu tiên của khách (Telegram/WhatsApp/Discord...) — email ít được trả lời.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS contact_channel text,
  ADD COLUMN IF NOT EXISTS contact_handle  text;
