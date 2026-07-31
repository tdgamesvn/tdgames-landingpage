-- Blog radar: chủ đề AI gợi ý mỗi sáng, chờ CEO chọn + kể chuyện thật.
create table if not exists blog_topics (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  why text,
  ask text,
  source text,
  -- new: vừa gợi ý | picked: CEO đã chọn | drafted: đã sinh bản nháp | skipped
  status text not null default 'new',
  ceo_note text,
  post_id uuid references blog_posts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists blog_topics_status_created_idx
  on blog_topics (status, created_at desc);
