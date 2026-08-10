-- Auto-blog: cron sáng tự dựng + đăng bài từ chủ đề radar.
-- Mặc định TẮT — sếp bật trong /admin tab Blog.
insert into app_settings (key, value)
values ('blog_auto_enabled', '0'), ('blog_auto_count', '1')
on conflict (key) do nothing;
