-- AI media tables for the MAV portfolio.
-- Run this in the Supabase SQL editor for the current project.
-- This script creates only AI-specific tables, grants, and policies.
-- It is safe to run again if the tables already exist.

create table if not exists public.ai_images (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  thumbnail_url text,
  alt_text text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_images
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists image_url text,
  add column if not exists thumbnail_url text,
  add column if not exists alt_text text,
  add column if not exists sort_order integer default 0,
  add column if not exists is_published boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.ai_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_videos
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text,
  add column if not exists sort_order integer default 0,
  add column if not exists is_published boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.ai_images enable row level security;
alter table public.ai_videos enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.ai_images to anon, authenticated;
grant select on public.ai_videos to anon, authenticated;
grant select, insert, update, delete on public.ai_images to service_role;
grant select, insert, update, delete on public.ai_videos to service_role;

drop policy if exists "Published AI images are publicly readable" on public.ai_images;
create policy "Published AI images are publicly readable"
on public.ai_images
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Published AI videos are publicly readable" on public.ai_videos;
create policy "Published AI videos are publicly readable"
on public.ai_videos
for select
to anon, authenticated
using (is_published = true);

create index if not exists ai_images_public_sort_idx
on public.ai_images (is_published, sort_order, created_at);

create index if not exists ai_videos_public_sort_idx
on public.ai_videos (is_published, sort_order, created_at);

notify pgrst, 'reload schema';
