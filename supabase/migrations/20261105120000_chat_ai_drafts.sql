-- AI trả lời chat — Phase A (bản nháp chỉ staff thấy). Spec: docs/superpowers/specs/2026-11-05-chat-ai-design.md
-- Chỉ thêm, không sửa bảng cũ.

-- Kho kiến thức AI được phép dùng (thẻ sự thật đã duyệt). AI chỉ trả lời từ đây + danh sách job đang mở.
create table if not exists public.chat_kb (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  audience text not null default 'any' check (audience in ('client', 'candidate', 'any')),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.chat_kb enable row level security;

-- Bản nháp AI cho từng tin khách + nhật ký token/chi phí (dùng luôn để tính ngân sách tháng).
create table if not exists public.chat_ai_drafts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  trigger_message_id uuid references public.chat_messages(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'discarded', 'superseded', 'failed', 'skipped')),
  answer text,
  needs_human boolean not null default true,
  confidence text,
  sources jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  model text,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(10, 5) not null default 0,
  error text,
  rating smallint check (rating in (-1, 1)),
  edited boolean,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.chat_ai_drafts enable row level security;
create index if not exists chat_ai_drafts_thread_idx on public.chat_ai_drafts (thread_id, created_at desc);
create index if not exists chat_ai_drafts_created_idx on public.chat_ai_drafts (created_at);

insert into public.app_settings (key, value, updated_at) values
  ('chat_ai_mode', 'draft', now()),
  ('chat_ai_budget_usd', '100', now())
on conflict (key) do nothing;

-- Hạt giống kho kiến thức: câu trả lời có sẵn đã duyệt + thông tin công ty trên /company-profile.
insert into public.chat_kb (title, content, audience, sort_order)
select regexp_replace(label, '^[^A-Za-z0-9]+', ''), answer, audience, sort_order
from public.chat_quick_replies
where active and not exists (select 1 from public.chat_kb);

insert into public.chat_kb (title, content, audience, sort_order)
select v.title, v.content, v.audience, v.sort_order
from (values
  ('About TD Games', 'TD Games Company Limited (TD Games Studio) is a 2D game art, animation and VFX outsourcing studio in Hanoi, Vietnam, founded in 2022. 50+ projects delivered, 15+ studios served, 1000+ assets shipped. Art, animation and VFX are under one roof. A permanent core team in Hanoi (artists, animators, VFX artists, plus an art lead and a producer on each project), extended by a vetted freelance bench when a project needs to scale.', 'any', 1000),
  ('Contact & address', 'Email: info@tdgamestudio.com. Hotline: (+84) 36 260 8491. Studio: 4th Floor, H1 Tower — Hoa Binh Green City, 505 Minh Khai, Hai Ba Trung, Hanoi, Vietnam (GMT+7). Website: tdgamestudio.com. Contact form: /contact.', 'any', 1010),
  ('Services', 'Services: 2D Art (characters, splash art, UI-support art), 2D Animation (Spine 2D and frame-by-frame), 2D VFX (skill effects, hits, trails), and Full Game Production (whole games from concept to store build — game design & GDD, art, animation, VFX and Unity development). Service pages: /services.', 'client', 1020),
  ('Tools & engines', 'Animation: Spine 2D, After Effects, frame-by-frame, Dragon Bones. Art: Photoshop, Clip Studio Paint, Illustrator, Procreate. Engines: Unity, Cocos Creator, custom pipelines. Deliverables: layered PSD, Spine source + atlas, sprite sheets, frame sequences.', 'client', 1030),
  ('Communication', 'Channels: Slack, Discord, Email — we join your workspace. Project tracking: ClickUp shared board, or your tool. File delivery: Google Drive, Dropbox, or direct to your repo. Time zone GMT+7 — 4–6h overlap with EU, full overlap with APAC. Weekly progress summary with WIP previews. Response within 12 working hours, same-day on active sprints.', 'client', 1040),
  ('Quality & security', 'Technical check: bone naming, atlas packing, pivot points and file structure verified per your spec. Three revision rounds included per asset; further rounds quoted upfront. Layered PSD and Spine project files ship with every delivery. Lifetime warranty for defects traceable to our work. We sign your NDA before receiving any material. Per-project drives; artists only see their assigned project. Nothing appears in our portfolio without written approval.', 'client', 1050),
  ('Portfolio', 'Selected work on /portfolio: Monster Legends (Spine 2D, Social Point), Yomi 2 super-move cutscenes, Epic Card battle VFX, Horse Racing splash art, Battle of the Gods — Mytheria login screen, Boss Animation — The Twins, Stickman Legend monsters, Kayn Snow Moon login screen.', 'client', 1060),
  ('Applying for a job', 'Open positions are listed on /careers, each with its own apply form. HR reviews every application and contacts shortlisted candidates by email. For hiring questions, candidates can also email hiring@tdgamestudio.com.', 'candidate', 1070)
) as v(title, content, audience, sort_order)
where not exists (select 1 from public.chat_kb where title = v.title);
