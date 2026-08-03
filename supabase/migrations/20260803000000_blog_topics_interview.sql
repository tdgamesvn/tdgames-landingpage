-- Lưu buổi phỏng vấn AI ↔ CEO để trả lời được nhiều hôm, thoát ra vào lại vẫn còn.
-- Mảng [{q, why, a}] — `a` luôn là câu trả lời mới nhất của CEO (đè bản nháp AI).
alter table blog_topics add column if not exists interview jsonb;
