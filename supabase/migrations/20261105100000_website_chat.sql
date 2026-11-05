-- Chat trên website (khách + ứng viên) — spec docs/superpowers/specs/2026-11-05-website-chat-design.md
-- Chỉ thêm bảng/khoá mới. RLS bật, không policy: mọi truy cập qua API server (service role).

create table if not exists public.chat_threads (
  id                     uuid primary key default gen_random_uuid(),
  visitor_token_hash     text not null unique,
  audience               text not null default 'client' check (audience in ('client', 'candidate')),
  status                 text not null default 'open' check (status in ('open', 'answered', 'closed')),
  needs_human            boolean not null default false,
  name                   text,
  email                  text,
  country                text,
  user_agent             text,
  first_page             text,
  last_page              text,
  pages                  text[] not null default '{}',
  merged_into            uuid references public.chat_threads(id) on delete set null,
  lead_id                uuid references public.leads(id) on delete set null,
  email_link_token_hash  text unique,
  email_link_expires_at  timestamptz,
  email_pending          boolean not null default false,
  last_visitor_seen_at   timestamptz,
  last_message_at        timestamptz not null default now(),
  last_push_at           timestamptz,
  last_email_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists chat_threads_inbox_idx on public.chat_threads (needs_human, last_message_at desc);
create index if not exists chat_threads_email_idx on public.chat_threads (lower(email));
create index if not exists chat_threads_pending_idx on public.chat_threads (email_pending) where email_pending;

create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  thread_id       uuid not null references public.chat_threads(id) on delete cascade,
  sender          text not null check (sender in ('visitor', 'staff', 'system', 'ai')),
  staff_user_id   uuid,
  staff_name      text,
  kind            text not null default 'text' check (kind in ('text', 'quick_reply', 'canned_answer', 'contact_form')),
  body            text not null,
  quick_reply_id  uuid,
  link_label      text,
  link_url        text,
  created_at      timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

create table if not exists public.chat_quick_replies (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  audience    text not null default 'any' check (audience in ('client', 'candidate', 'any')),
  answer      text not null,
  link_label  text,
  link_url    text,
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_quick_replies enable row level security;

insert into public.app_settings (key, value, updated_at) values
  ('chat_widget_enabled', 'true', now()),
  ('chat_ai_enabled', 'false', now()),
  ('chat_hours', '{"tz":"Asia/Ho_Chi_Minh","start":"08:00","end":"22:00"}', now())
on conflict (key) do nothing;
