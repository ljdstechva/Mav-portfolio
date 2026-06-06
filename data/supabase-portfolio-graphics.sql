-- Graphic Design portfolio tables for the MAV portfolio.
-- Run this in the Supabase SQL editor for the project configured by
-- NEXT_PUBLIC_SUPABASE_URL in this repo.
--
-- The app and admin routes expect:
--   public.industries(id, name, created_at, updated_at)
--   public.clients(id, industry_id, name, image_url, sort_order, created_at, updated_at)
--
-- This script is safe to rerun. It does not delete or seed rows.

create extension if not exists pgcrypto;

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.industries
  add column if not exists name text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid references public.industries(id) on delete cascade,
  name text not null,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients
  add column if not exists industry_id uuid,
  add column if not exists name text,
  add column if not exists image_url text,
  add column if not exists sort_order integer default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_industry_id_fkey'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
      add constraint clients_industry_id_fkey
      foreign key (industry_id)
      references public.industries(id)
      on delete cascade;
  end if;
end $$;

create index if not exists industries_created_at_idx
on public.industries (created_at);

create index if not exists clients_industry_sort_idx
on public.clients (industry_id, sort_order, created_at);

create index if not exists clients_name_idx
on public.clients (name);

alter table public.industries enable row level security;
alter table public.clients enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.industries to anon, authenticated, service_role;
grant select on table public.clients to anon, authenticated, service_role;
grant insert, update, delete on table public.industries to service_role;
grant insert, update, delete on table public.clients to service_role;

drop policy if exists "Public can read portfolio industries" on public.industries;
create policy "Public can read portfolio industries"
  on public.industries
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read portfolio clients" on public.clients;
create policy "Public can read portfolio clients"
  on public.clients
  for select
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
