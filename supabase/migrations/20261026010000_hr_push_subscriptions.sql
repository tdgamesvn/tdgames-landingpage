-- Thiết bị đã bật thông báo đẩy (Web Push) cho app PWA /hr.
-- Mỗi trình duyệt/điện thoại = 1 endpoint. Endpoint hết hạn (404/410) bị xoá khi gửi.
-- Chỉ service role đọc/ghi (RLS bật, không policy).

CREATE TABLE IF NOT EXISTS public.hr_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  label text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz
);

ALTER TABLE public.hr_push_subscriptions ENABLE ROW LEVEL SECURITY;
