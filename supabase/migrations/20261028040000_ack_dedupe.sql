-- Chống gửi trùng mail "Cảm ơn ứng tuyển": mỗi địa chỉ (lower) tối đa 1 dòng / ngày (UTC), mọi job.
-- Index một phần chỉ áp cho kind='application_received' → không chặn các loại mail khác.
-- Code đặt chỗ (insert) trước khi gửi; xung đột 23505 → bỏ qua.
CREATE UNIQUE INDEX IF NOT EXISTS candidate_emails_ack_dedupe_idx
  ON public.candidate_emails (lower(to_email), ((created_at AT TIME ZONE 'UTC')::date))
  WHERE kind = 'application_received';
