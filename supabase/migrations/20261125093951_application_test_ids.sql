-- Chọn bài test gửi cho từng ứng viên (sếp 2026-11-25): job có nhiều đề (vd. Spine Junior–Senior vs
-- Intern/Fresher) thì HR tick đề nào gửi; trang /test/<token> chỉ hiện đúng đề đó.
-- NULL = như cũ (hiện tất cả đề của job) → link đã gửi trước đây không đổi.
-- Mảng uuid thay vì bảng nối: chỉ đọc/ghi theo hồ sơ, không cần truy vấn ngược. Đề bị xoá → id thừa
-- bị lọc bỏ khi đọc (job_tests.id ON DELETE không với tới mảng).
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS test_ids uuid[];
