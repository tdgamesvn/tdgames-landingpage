-- Tin cuối lưu sẵn trên luồng (danh sách chat không phải quét chat_messages). Chỉ thêm cột.
alter table public.chat_threads add column if not exists last_preview text;
alter table public.chat_threads add column if not exists last_sender text;
