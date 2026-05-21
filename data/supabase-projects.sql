-- Optional projects table for src/app/api/projects.
-- The public portfolio currently uses the portfolio graphics tables; this table
-- keeps the legacy projects endpoint safe if you decide to enable it.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  image_url text,
  link text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
  on public.projects
  for select
  using (true);

drop policy if exists "Authenticated users can manage projects" on public.projects;
create policy "Authenticated users can manage projects"
  on public.projects
  for all
  to authenticated
  using (true)
  with check (true);
