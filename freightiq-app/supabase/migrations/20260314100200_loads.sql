create extension if not exists "pgcrypto";

create table if not exists public.loads (
  id uuid primary key default gen_random_uuid(),
  shipper_id uuid references public.profiles(id) on delete set null,
  title text not null,
  origin_address text not null,
  origin_lat float8 not null,
  origin_lng float8 not null,
  destination_address text not null,
  destination_lat float8 not null,
  destination_lng float8 not null,
  weight_kg float8,
  volume_m3 float8,
  freight_type text,
  pickup_date date,
  delivery_date date,
  budget_usd float8,
  status text not null default 'open' check (status in ('open', 'matched', 'in_transit', 'delivered', 'cancelled')),
  co2_score float8,
  preferred_mode text not null default 'truck',
  created_at timestamptz not null default now()
);

create index if not exists loads_shipper_id_idx on public.loads (shipper_id);
create index if not exists loads_status_idx on public.loads (status);
create index if not exists loads_created_at_idx on public.loads (created_at desc);

alter table public.loads enable row level security;

drop policy if exists "Shippers can manage own loads" on public.loads;
drop policy if exists "All users can view open loads" on public.loads;

create policy "Shippers can manage own loads"
on public.loads
for all
using (auth.uid() = shipper_id)
with check (auth.uid() = shipper_id);

create policy "All users can view open loads"
on public.loads
for select
using (status = 'open');

-- Optional: enable realtime later once dashboard wiring exists.
-- alter publication supabase_realtime add table public.loads;

