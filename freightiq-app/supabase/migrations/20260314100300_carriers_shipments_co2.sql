-- ============================================================
-- Migration 0004: carriers, shipments, co2_records, modal_comparisons
-- Depends on: 0001 (profiles), 0003 (loads)
-- ============================================================

-- ─────────────────────────────────────────
-- 1. CARRIERS
-- ─────────────────────────────────────────
create table if not exists public.carriers (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  company_name     text not null,
  fleet_size       int  not null default 1 check (fleet_size >= 0),
  service_modes    text[]  not null default '{truck}',   -- ['truck','rail','sea','air']
  coverage_corridors jsonb default '[]'::jsonb,          -- GeoJSON corridor array
  rating           float8  not null default 0 check (rating between 0 and 5),
  total_deliveries int     not null default 0,
  verified         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists carriers_owner_id_idx  on public.carriers (owner_id);
create index if not exists carriers_verified_idx  on public.carriers (verified);

alter table public.carriers enable row level security;

drop policy if exists "Carriers can manage own record"  on public.carriers;
drop policy if exists "All authenticated users can view verified carriers" on public.carriers;

create policy "Carriers can manage own record"
  on public.carriers for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "All authenticated users can view verified carriers"
  on public.carriers for select
  using (verified = true or auth.uid() = owner_id);


-- ─────────────────────────────────────────
-- 2. SHIPMENTS  (load + carrier matched)
-- ─────────────────────────────────────────
create table if not exists public.shipments (
  id                   uuid primary key default gen_random_uuid(),
  load_id              uuid not null references public.loads(id)    on delete cascade,
  carrier_id           uuid not null references public.carriers(id) on delete restrict,
  agreed_price_usd     float8,
  transport_mode       text not null default 'truck'
                         check (transport_mode in ('truck','rail','sea','air')),
  co2_kg               float8,
  distance_km          float8,
  status               text not null default 'confirmed'
                         check (status in ('confirmed','in_transit','delivered','cancelled')),
  tracking_updates     jsonb not null default '[]'::jsonb,
  estimated_delivery   timestamptz,
  actual_delivery      timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists shipments_load_id_idx     on public.shipments (load_id);
create index if not exists shipments_carrier_id_idx  on public.shipments (carrier_id);
create index if not exists shipments_status_idx      on public.shipments (status);
create index if not exists shipments_created_at_idx  on public.shipments (created_at desc);

alter table public.shipments enable row level security;

drop policy if exists "Shippers can view their shipments"  on public.shipments;
drop policy if exists "Carriers can view their shipments"  on public.shipments;
drop policy if exists "Carriers can update their shipments" on public.shipments;

-- Shippers reach shipments via the load they own
create policy "Shippers can view their shipments"
  on public.shipments for select
  using (
    exists (
      select 1 from public.loads
      where loads.id = shipments.load_id
        and loads.shipper_id = auth.uid()
    )
  );

-- Carriers reach shipments via their carrier record
create policy "Carriers can view their shipments"
  on public.shipments for select
  using (
    exists (
      select 1 from public.carriers
      where carriers.id = shipments.carrier_id
        and carriers.owner_id = auth.uid()
    )
  );

create policy "Carriers can update their shipments"
  on public.shipments for update
  using (
    exists (
      select 1 from public.carriers
      where carriers.id = shipments.carrier_id
        and carriers.owner_id = auth.uid()
    )
  );

-- Enable realtime for live tracking
alter publication supabase_realtime add table public.shipments;


-- ─────────────────────────────────────────
-- 3. CO2 RECORDS
-- ─────────────────────────────────────────
create table if not exists public.co2_records (
  id               uuid primary key default gen_random_uuid(),
  shipment_id      uuid not null references public.shipments(id) on delete cascade,
  shipper_id       uuid not null references public.profiles(id)  on delete cascade,
  transport_mode   text not null
                     check (transport_mode in ('truck','rail','sea','air')),
  distance_km      float8 not null,
  weight_kg        float8 not null,
  co2_kg           float8 not null,
  offset_purchased boolean not null default false,
  offset_kg        float8  not null default 0,
  recorded_at      timestamptz not null default now()
);

create index if not exists co2_records_shipper_id_idx   on public.co2_records (shipper_id);
create index if not exists co2_records_shipment_id_idx  on public.co2_records (shipment_id);
create index if not exists co2_records_recorded_at_idx  on public.co2_records (recorded_at desc);

alter table public.co2_records enable row level security;

drop policy if exists "Shippers can manage own CO2 records" on public.co2_records;

create policy "Shippers can manage own CO2 records"
  on public.co2_records for all
  using  (auth.uid() = shipper_id)
  with check (auth.uid() = shipper_id);


-- ─────────────────────────────────────────
-- 4. MODAL COMPARISONS  (one row per load)
-- ─────────────────────────────────────────
create table if not exists public.modal_comparisons (
  id          uuid primary key default gen_random_uuid(),
  load_id     uuid not null references public.loads(id) on delete cascade,

  -- CO2 (kg)
  truck_co2   float8,
  rail_co2    float8,
  sea_co2     float8,
  air_co2     float8,

  -- Estimated cost (USD)
  truck_cost  float8,
  rail_cost   float8,
  sea_cost    float8,
  air_cost    float8,

  -- Transit time (days)
  truck_days  float8,
  rail_days   float8,
  sea_days    float8,
  air_days    float8,

  created_at  timestamptz not null default now()
);

create unique index if not exists modal_comparisons_load_id_unique_idx
  on public.modal_comparisons (load_id);   -- one comparison per load

alter table public.modal_comparisons enable row level security;

drop policy if exists "Shippers can view their modal comparisons"  on public.modal_comparisons;
drop policy if exists "All users can view modal comparisons for open loads" on public.modal_comparisons;

-- Owner of the load can always see their comparison
create policy "Shippers can view their modal comparisons"
  on public.modal_comparisons for all
  using (
    exists (
      select 1 from public.loads
      where loads.id = modal_comparisons.load_id
        and loads.shipper_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.loads
      where loads.id = modal_comparisons.load_id
        and loads.shipper_id = auth.uid()
    )
  );

-- Anyone can see comparisons attached to open loads (needed on load board)
create policy "All users can view modal comparisons for open loads"
  on public.modal_comparisons for select
  using (
    exists (
      select 1 from public.loads
      where loads.id = modal_comparisons.load_id
        and loads.status = 'open'
    )
  );


-- ─────────────────────────────────────────
-- 5. Enable Realtime for loads  (deferred from migration 0003)
-- ─────────────────────────────────────────
alter publication supabase_realtime add table public.loads;
