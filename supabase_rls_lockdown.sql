-- Run this in Supabase SQL Editor (project: bsanjkllusdrtbfvffvf)
-- Goal: enable RLS on all public tables and apply safe defaults.

begin;

-- 1) Ensure RLS is enabled (add more tables here if needed)
alter table if exists public.products enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.queries enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.reviews enable row level security;
alter table if exists public.subscribers enable row level security;
alter table if exists public.coupons enable row level security;

-- 2) Drop old broad policies (idempotent)
drop policy if exists "Public read access for products" on public.products;
drop policy if exists "Public read access for reviews" on public.reviews;
drop policy if exists "Public insert access for reviews" on public.reviews;
drop policy if exists "Public can insert into users" on public.users;
drop policy if exists "Public can insert orders" on public.orders;
drop policy if exists "Public can insert queries" on public.queries;
drop policy if exists "Public can insert subscribers" on public.subscribers;

-- 3) Public storefront access
create policy "Public read access for products"
on public.products for select
using (true);

create policy "Public read access for reviews"
on public.reviews for select
using (true);

create policy "Public insert access for reviews"
on public.reviews for insert
with check (true);

-- 4) Public inserts from site forms/checkout
create policy "Public can insert into users"
on public.users for insert
with check (true);

create policy "Public can insert orders"
on public.orders for insert
with check (true);

create policy "Public can insert queries"
on public.queries for insert
with check (true);

create policy "Public can insert subscribers"
on public.subscribers for insert
with check (true);

-- 5) Optional: let authenticated users read/update their own profile only
drop policy if exists "Users can read own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;

create policy "Users can read own profile"
on public.users for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

commit;

-- Verification helper:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
