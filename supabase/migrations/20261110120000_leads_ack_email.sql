-- Mail xác nhận tự động cho khách gửi form báo giá (AI viết, hẹn giờ gửi qua Resend ~4–7 phút).
-- Lưu id mail để /crm huỷ được trước giờ gửi (đổi trạng thái lead / bấm Huỷ / xoá lead).
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS ack_email_id text,
  ADD COLUMN IF NOT EXISTS ack_send_at timestamptz,
  ADD COLUMN IF NOT EXISTS ack_status text,
  ADD COLUMN IF NOT EXISTS ack_writer text;

COMMENT ON COLUMN public.leads.ack_status IS
  'Mail xác nhận: scheduled | cancelled | skipped | error. null = lead cũ / không gửi.';
COMMENT ON COLUMN public.leads.ack_writer IS 'ai | template';
