-- Số điện thoại tài khoản /hr — dùng làm thông tin người liên hệ trong mail ứng viên (vd. mail offer).
ALTER TABLE public.hr_users
  ADD COLUMN IF NOT EXISTS phone text CHECK (phone ~ '^\+?[0-9]{9,13}$');
