-- Đặt phòng họp TDC từ lịch PV Offline (spec docs/superpowers/specs/2026-11-25-hr-tdc-room-booking-design.md).
-- Booking bên TDC dùng id buổi PV làm mã tham chiếu (external_ref) nên 1 buổi PV chỉ giữ tối đa 1 phòng.
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS ends_at         timestamptz,
  ADD COLUMN IF NOT EXISTS room_id         text,        -- id phòng bên TDC (room_rooms.id)
  ADD COLUMN IF NOT EXISTS room_name       text,
  ADD COLUMN IF NOT EXISTS room_booking_id text,        -- room_bookings.id bên TDC
  ADD COLUMN IF NOT EXISTS room_state      text,        -- null = không đặt phòng
  ADD COLUMN IF NOT EXISTS room_error      text;

ALTER TABLE public.interview_sessions ADD CONSTRAINT interview_sessions_room_state_check
  CHECK (room_state IS NULL OR room_state IN ('booked', 'error', 'cancel_error'));

ALTER TABLE public.interview_sessions ADD CONSTRAINT interview_sessions_ends_after_start
  CHECK (ends_at IS NULL OR scheduled_at IS NULL OR ends_at > scheduled_at);
