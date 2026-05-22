create extension if not exists pgcrypto;

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'video', 'gif', 'other')),
  source_type text not null check (source_type in ('local_public', 'external')),
  original_url text not null unique,
  current_url text not null,
  r2_key text,
  r2_url text,
  status text not null default 'active' check (status in ('active', 'archived')),
  used_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_source_type_idx on media_assets (source_type);
create index if not exists media_assets_kind_idx on media_assets (kind);
create index if not exists media_assets_status_idx on media_assets (status);

create or replace function set_media_assets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists media_assets_set_updated_at on media_assets;
create trigger media_assets_set_updated_at
before update on media_assets
for each row execute procedure set_media_assets_updated_at();
