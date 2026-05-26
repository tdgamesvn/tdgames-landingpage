-- Migration: add label column to media_assets
-- Purpose: slug identifier used for runtime URL resolution (e.g. "about-hero", "home-hero-1")
-- Task: Runtime Media URL Resolution — Task 1 of 6

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS label text UNIQUE;

COMMENT ON COLUMN public.media_assets.label IS
  'Slug định danh ngắn gọn dùng để resolve URL tại runtime, ví dụ "about-hero", "home-hero-1"';
