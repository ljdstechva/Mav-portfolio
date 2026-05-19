create table if not exists public.portfolio_category_order (
  id uuid primary key default gen_random_uuid(),
  category_id text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint portfolio_category_order_category_id_not_empty check (length(trim(category_id)) > 0)
);

create index if not exists portfolio_category_order_sort_order_idx
on public.portfolio_category_order (sort_order, category_id);

alter table public.portfolio_category_order enable row level security;

grant select on table public.portfolio_category_order to anon, authenticated, service_role;
grant insert, update on table public.portfolio_category_order to authenticated, service_role;

insert into public.portfolio_category_order (category_id, sort_order)
values
  ('graphics', 0),
  ('carousels', 1),
  ('videos', 2),
  ('ai-images', 3),
  ('ai-videos', 4),
  ('copywriting', 5),
  ('photo-editing', 6),
  ('stories', 7)
on conflict (category_id) do nothing;
