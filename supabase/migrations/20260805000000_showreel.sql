-- Showreel: gallery Art/Animation/VFX cho trang /showreel.
-- Tách khỏi `projects` vì đây là media lẻ (1 ảnh/video = 1 item), không phải case study.
create table if not exists showreel_items (
  id uuid primary key default gen_random_uuid(),
  -- tab chính: art | animation | vfx
  tab text not null check (tab in ('art', 'animation', 'vfx')),
  -- category con free-text ("UI", "Concept", "Environment"...) — trang tự gom nhóm
  category text not null default '',
  title text not null default '',
  url text not null,
  -- poster cho video; ảnh thì để null
  thumbnail text,
  kind text not null default 'image' check (kind in ('image', 'video')),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists showreel_items_tab_sort_idx
  on showreel_items (tab, sort_order);

-- RLS: chỉ cho anon/authenticated đọc item active; ghi đi qua service role key (bỏ qua RLS).
alter table showreel_items enable row level security;
drop policy if exists showreel_public_read on showreel_items;
create policy showreel_public_read on showreel_items
  for select to anon, authenticated using (active);
