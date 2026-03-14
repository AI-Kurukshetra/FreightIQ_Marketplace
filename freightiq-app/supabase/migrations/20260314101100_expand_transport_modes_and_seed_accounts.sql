begin;

create extension if not exists pgcrypto;

alter table public.shipments
  drop constraint if exists shipments_transport_mode_check;

alter table public.shipments
  add constraint shipments_transport_mode_check
  check (transport_mode in ('truck', 'rail', 'sea', 'air', 'ev_truck', 'van', 'intermodal', 'express_air'));

alter table public.co2_records
  drop constraint if exists co2_records_transport_mode_check;

alter table public.co2_records
  add constraint co2_records_transport_mode_check
  check (transport_mode in ('truck', 'rail', 'sea', 'air', 'ev_truck', 'van', 'intermodal', 'express_air'));

alter table public.carriers
  drop constraint if exists carriers_service_modes_check;

alter table public.carriers
  add constraint carriers_service_modes_check
  check (
    cardinality(service_modes) > 0
    and service_modes <@ array['truck', 'rail', 'sea', 'air', 'ev_truck', 'van', 'intermodal', 'express_air']::text[]
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'loads_preferred_mode_check'
      and conrelid = 'public.loads'::regclass
  ) then
    alter table public.loads
      add constraint loads_preferred_mode_check
      check (preferred_mode in ('truck', 'rail', 'sea', 'air', 'ev_truck', 'van', 'intermodal', 'express_air'));
  end if;
end
$$;

create temp table tmp_transport_accounts (
  email text primary key,
  full_name text not null,
  company_name text not null,
  role text not null check (role in ('shipper', 'carrier')),
  subscription_tier text not null
) on commit drop;

insert into tmp_transport_accounts (email, full_name, company_name, role, subscription_tier)
values
  ('neel.shipper16@freightiq.demo', 'Neel Khanna', 'VoltRoute Retail', 'shipper', 'growth'),
  ('alia.shipper17@freightiq.demo', 'Alia Suri', 'FastBridge Commerce', 'shipper', 'pro'),
  ('om.shipper18@freightiq.demo', 'Om Prakash', 'CargoLeaf Distribution', 'shipper', 'growth'),
  ('rhea.shipper19@freightiq.demo', 'Rhea Kaul', 'SkyCart Health', 'shipper', 'pro'),
  ('pranav.carrier11@freightiq.demo', 'Pranav Sood', 'VoltHaul EV Networks', 'carrier', 'growth'),
  ('kavya.carrier12@freightiq.demo', 'Kavya Rao', 'CitySwift Vans', 'carrier', 'growth'),
  ('mohit.carrier13@freightiq.demo', 'Mohit Lamba', 'InterAxis Freight', 'carrier', 'pro'),
  ('ishita.carrier14@freightiq.demo', 'Ishita Bose', 'AeroEdge Express', 'carrier', 'pro');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  account.email,
  extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name', account.full_name,
    'company_name', account.company_name,
    'role', account.role
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
from tmp_transport_accounts account
where not exists (
  select 1
  from auth.users existing
  where existing.email = account.email
);

insert into public.profiles (id, email, full_name, company_name, role, subscription_tier)
select
  auth_user.id,
  account.email,
  account.full_name,
  account.company_name,
  account.role,
  account.subscription_tier
from tmp_transport_accounts account
join auth.users auth_user on auth_user.email = account.email
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  role = excluded.role,
  subscription_tier = excluded.subscription_tier;

with carrier_profiles as (
  select
    profile.id as owner_id,
    profile.email,
    profile.company_name
  from public.profiles profile
  join tmp_transport_accounts account
    on account.email = profile.email
   and account.role = 'carrier'
  left join public.carriers carrier on carrier.owner_id = profile.id
  where carrier.id is null
)
insert into public.carriers (
  id,
  owner_id,
  company_name,
  fleet_size,
  service_modes,
  coverage_corridors,
  rating,
  total_deliveries,
  verified
)
select
  gen_random_uuid(),
  carrier.owner_id,
  carrier.company_name,
  case carrier.email
    when 'pranav.carrier11@freightiq.demo' then 24
    when 'kavya.carrier12@freightiq.demo' then 19
    when 'mohit.carrier13@freightiq.demo' then 31
    else 12
  end,
  case carrier.email
    when 'pranav.carrier11@freightiq.demo' then array['ev_truck', 'truck', 'van']::text[]
    when 'kavya.carrier12@freightiq.demo' then array['van', 'truck']::text[]
    when 'mohit.carrier13@freightiq.demo' then array['intermodal', 'rail', 'truck']::text[]
    else array['express_air', 'air']::text[]
  end,
  case carrier.email
    when 'pranav.carrier11@freightiq.demo' then jsonb_build_array(
      jsonb_build_object('origin', 'Ahmedabad', 'destination', 'Mumbai', 'radius_km', 140),
      jsonb_build_object('origin', 'Pune', 'destination', 'Mumbai', 'radius_km', 90)
    )
    when 'kavya.carrier12@freightiq.demo' then jsonb_build_array(
      jsonb_build_object('origin', 'Delhi', 'destination', 'Jaipur', 'radius_km', 105),
      jsonb_build_object('origin', 'Mumbai', 'destination', 'Pune', 'radius_km', 80)
    )
    when 'mohit.carrier13@freightiq.demo' then jsonb_build_array(
      jsonb_build_object('origin', 'Chennai', 'destination', 'Bengaluru', 'radius_km', 100),
      jsonb_build_object('origin', 'Hyderabad', 'destination', 'Pune', 'radius_km', 135)
    )
    else jsonb_build_array(
      jsonb_build_object('origin', 'Delhi', 'destination', 'Lucknow', 'radius_km', 150),
      jsonb_build_object('origin', 'Delhi', 'destination', 'Mumbai', 'radius_km', 200)
    )
  end,
  case carrier.email
    when 'pranav.carrier11@freightiq.demo' then 4.7
    when 'kavya.carrier12@freightiq.demo' then 4.4
    when 'mohit.carrier13@freightiq.demo' then 4.8
    else 4.6
  end,
  case carrier.email
    when 'pranav.carrier11@freightiq.demo' then 182
    when 'kavya.carrier12@freightiq.demo' then 133
    when 'mohit.carrier13@freightiq.demo' then 221
    else 96
  end,
  true
from carrier_profiles carrier;

create temp table tmp_transport_load_specs (
  shipper_email text not null,
  carrier_email text not null,
  title text not null,
  origin_address text not null,
  origin_lat float8 not null,
  origin_lng float8 not null,
  destination_address text not null,
  destination_lat float8 not null,
  destination_lng float8 not null,
  distance_km float8 not null,
  weight_kg float8 not null,
  volume_m3 float8 not null,
  freight_type text not null,
  pickup_date date not null,
  delivery_date date not null,
  budget_usd float8 not null,
  load_status text not null,
  preferred_mode text not null,
  shipment_status text not null,
  co2_score float8 not null,
  created_at timestamptz not null
) on commit drop;

insert into tmp_transport_load_specs (
  shipper_email,
  carrier_email,
  title,
  origin_address,
  origin_lat,
  origin_lng,
  destination_address,
  destination_lat,
  destination_lng,
  distance_km,
  weight_kg,
  volume_m3,
  freight_type,
  pickup_date,
  delivery_date,
  budget_usd,
  load_status,
  preferred_mode,
  shipment_status,
  co2_score,
  created_at
)
values
  (
    'neel.shipper16@freightiq.demo',
    'pranav.carrier11@freightiq.demo',
    'EV grocery replenishment - West corridor',
    'Ahmedabad Fulfillment Campus',
    23.0225,
    72.5714,
    'Mumbai Urban Retail Grid',
    19.0760,
    72.8777,
    530.0,
    6200.0,
    20.0,
    'grocery',
    current_date,
    current_date + 1,
    1290.0,
    'in_transit',
    'ev_truck',
    'in_transit',
    127.4,
    now() - interval '26 hours'
  ),
  (
    'neel.shipper16@freightiq.demo',
    'kavya.carrier12@freightiq.demo',
    'Quick retail van lane - NCR',
    'Delhi Smart Store Hub',
    28.7041,
    77.1025,
    'Jaipur Express Depot',
    26.9124,
    75.7873,
    305.0,
    1900.0,
    9.0,
    'retail',
    current_date + 1,
    current_date + 1,
    940.0,
    'matched',
    'van',
    'matched',
    47.5,
    now() - interval '9 hours'
  ),
  (
    'alia.shipper17@freightiq.demo',
    'mohit.carrier13@freightiq.demo',
    'Intermodal appliance relay - South',
    'Chennai Appliance Yard',
    13.0827,
    80.2707,
    'Bengaluru Metro Crossdock',
    12.9716,
    77.5946,
    347.0,
    8800.0,
    27.0,
    'appliances',
    current_date,
    current_date + 2,
    1510.0,
    'in_transit',
    'intermodal',
    'picked_up',
    125.2,
    now() - interval '18 hours'
  ),
  (
    'alia.shipper17@freightiq.demo',
    'ishita.carrier14@freightiq.demo',
    'Critical express air pharma lane',
    'Delhi BioSafe Terminal',
    28.5562,
    77.1000,
    'Lucknow Clinical Hub',
    26.8467,
    80.9462,
    555.0,
    1700.0,
    6.0,
    'pharma',
    current_date,
    current_date,
    2580.0,
    'in_transit',
    'express_air',
    'in_transit',
    678.8,
    now() - interval '12 hours'
  ),
  (
    'om.shipper18@freightiq.demo',
    'pranav.carrier11@freightiq.demo',
    'EV electronics loop - Pune to Mumbai',
    'Pune Electronics Zone',
    18.5204,
    73.8567,
    'Navi Mumbai Tech Hub',
    19.0330,
    73.0297,
    165.0,
    5400.0,
    18.0,
    'electronics',
    current_date + 1,
    current_date + 2,
    1110.0,
    'matched',
    'ev_truck',
    'matched',
    33.9,
    now() - interval '6 hours'
  ),
  (
    'om.shipper18@freightiq.demo',
    'mohit.carrier13@freightiq.demo',
    'Intermodal home goods corridor',
    'Hyderabad Home Goods Park',
    17.3850,
    78.4867,
    'Pune Regional DC',
    18.5204,
    73.8567,
    560.0,
    9700.0,
    29.0,
    'home_goods',
    current_date + 1,
    current_date + 3,
    1660.0,
    'matched',
    'intermodal',
    'matched',
    222.7,
    now() - interval '7 hours'
  ),
  (
    'rhea.shipper19@freightiq.demo',
    'ishita.carrier14@freightiq.demo',
    'Express diagnostic kits to Mumbai',
    'Delhi Health Airside',
    28.5562,
    77.1000,
    'Mumbai Clinical Transfer Center',
    19.0896,
    72.8656,
    1148.0,
    1300.0,
    4.0,
    'diagnostics',
    current_date,
    current_date,
    3420.0,
    'matched',
    'express_air',
    'matched',
    1074.2,
    now() - interval '4 hours'
  ),
  (
    'rhea.shipper19@freightiq.demo',
    'kavya.carrier12@freightiq.demo',
    'Urban healthcare van drop - Jaipur',
    'Jaipur Med Supply Point',
    26.9124,
    75.7873,
    'Ajmer Clinic Grid',
    26.4499,
    74.6399,
    135.0,
    980.0,
    3.0,
    'healthcare',
    current_date + 1,
    current_date + 1,
    560.0,
    'delivered',
    'van',
    'delivered',
    10.8,
    now() - interval '72 hours'
  );

insert into public.loads (
  id,
  shipper_id,
  title,
  origin_address,
  origin_lat,
  origin_lng,
  destination_address,
  destination_lat,
  destination_lng,
  weight_kg,
  volume_m3,
  freight_type,
  pickup_date,
  delivery_date,
  budget_usd,
  status,
  co2_score,
  preferred_mode,
  created_at
)
select
  gen_random_uuid(),
  profile.id,
  spec.title,
  spec.origin_address,
  spec.origin_lat,
  spec.origin_lng,
  spec.destination_address,
  spec.destination_lat,
  spec.destination_lng,
  spec.weight_kg,
  spec.volume_m3,
  spec.freight_type,
  spec.pickup_date,
  spec.delivery_date,
  spec.budget_usd,
  spec.load_status,
  spec.co2_score,
  spec.preferred_mode,
  spec.created_at
from tmp_transport_load_specs spec
join public.profiles profile on profile.email = spec.shipper_email
where not exists (
  select 1
  from public.loads existing
  where existing.title = spec.title
);

create temp table tmp_transport_load_rows on commit drop as
select
  load.id as load_id,
  load.shipper_id,
  spec.shipper_email,
  spec.carrier_email,
  spec.title,
  spec.origin_address,
  spec.destination_address,
  spec.distance_km,
  spec.weight_kg,
  spec.budget_usd,
  spec.preferred_mode,
  spec.shipment_status,
  spec.co2_score,
  spec.created_at
from tmp_transport_load_specs spec
join public.loads load on load.title = spec.title;

insert into public.modal_comparisons (
  id,
  load_id,
  truck_co2,
  rail_co2,
  sea_co2,
  air_co2,
  truck_cost,
  rail_cost,
  sea_cost,
  air_cost,
  truck_days,
  rail_days,
  sea_days,
  air_days,
  created_at
)
select
  gen_random_uuid(),
  load.load_id,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.096)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.028)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.016)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.602)::numeric, 1)::float8,
  load.budget_usd,
  round((load.budget_usd * 0.89)::numeric, 1)::float8,
  round((load.budget_usd * 0.84)::numeric, 1)::float8,
  round((load.budget_usd * 1.52)::numeric, 1)::float8,
  round((0.9 + (load.distance_km / 420.0))::numeric, 1)::float8,
  round((1.6 + (load.distance_km / 330.0))::numeric, 1)::float8,
  round((2.8 + (load.distance_km / 250.0))::numeric, 1)::float8,
  round((0.3 + (load.distance_km / 900.0))::numeric, 1)::float8,
  load.created_at + interval '8 minutes'
from tmp_transport_load_rows load
where not exists (
  select 1
  from public.modal_comparisons modal
  where modal.load_id = load.load_id
);

insert into public.shipments (
  id,
  load_id,
  carrier_id,
  agreed_price_usd,
  transport_mode,
  co2_kg,
  distance_km,
  status,
  tracking_updates,
  estimated_delivery,
  actual_delivery,
  created_at
)
select
  gen_random_uuid(),
  load.load_id,
  carrier.id,
  round((load.budget_usd * 0.97)::numeric, 1)::float8,
  load.preferred_mode,
  load.co2_score,
  load.distance_km,
  load.shipment_status,
  case load.shipment_status
    when 'matched' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(load.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      )
    )
    when 'picked_up' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(load.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up and moving to transfer lane',
        'timestamp', to_char(load.created_at + interval '10 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      )
    )
    when 'in_transit' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(load.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment collected from origin',
        'timestamp', to_char(load.created_at + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment crossed live transit checkpoint',
        'timestamp', to_char(load.created_at + interval '14 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.destination_address
      )
    )
    else jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(load.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up from origin',
        'timestamp', to_char(load.created_at + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment reached final checkpoint',
        'timestamp', to_char(load.created_at + interval '20 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.destination_address
      ),
      jsonb_build_object(
        'status', 'delivered',
        'label', 'Shipment delivered successfully',
        'timestamp', to_char(load.created_at + interval '28 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.destination_address
      )
    )
  end,
  case load.shipment_status
    when 'matched' then load.created_at + interval '30 hours'
    when 'picked_up' then load.created_at + interval '22 hours'
    when 'in_transit' then load.created_at + interval '18 hours'
    else load.created_at + interval '28 hours'
  end,
  case
    when load.shipment_status = 'delivered' then load.created_at + interval '28 hours'
    else null
  end,
  load.created_at + interval '2 hours'
from tmp_transport_load_rows load
join public.profiles carrier_profile on carrier_profile.email = load.carrier_email
join public.carriers carrier on carrier.owner_id = carrier_profile.id
where not exists (
  select 1
  from public.shipments shipment
  where shipment.load_id = load.load_id
    and shipment.status <> 'cancelled'
);

insert into public.co2_records (
  id,
  shipment_id,
  shipper_id,
  transport_mode,
  distance_km,
  weight_kg,
  co2_kg,
  offset_purchased,
  offset_kg,
  recorded_at
)
select
  gen_random_uuid(),
  shipment.id,
  load.shipper_id,
  shipment.transport_mode,
  shipment.distance_km,
  load.weight_kg,
  shipment.co2_kg,
  shipment.status = 'delivered',
  case
    when shipment.status = 'delivered' then round((shipment.co2_kg * 0.24)::numeric, 1)::float8
    when shipment.status = 'in_transit' then round((shipment.co2_kg * 0.08)::numeric, 1)::float8
    else 0::float8
  end,
  shipment.created_at + interval '15 minutes'
from public.shipments shipment
join tmp_transport_load_rows load on load.load_id = shipment.load_id
where not exists (
  select 1
  from public.co2_records record
  where record.shipment_id = shipment.id
);

commit;
