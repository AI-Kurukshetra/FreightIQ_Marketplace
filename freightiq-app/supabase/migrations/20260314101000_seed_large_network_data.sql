begin;

create extension if not exists pgcrypto;

create temp table tmp_bulk_accounts (
  email text primary key,
  full_name text not null,
  company_name text not null,
  role text not null check (role in ('shipper', 'carrier')),
  subscription_tier text not null
) on commit drop;

insert into tmp_bulk_accounts (email, full_name, company_name, role, subscription_tier)
values
  ('riya.shipper01@freightiq.demo', 'Riya Kapoor', 'NorthGrid Retail', 'shipper', 'growth'),
  ('arjun.shipper02@freightiq.demo', 'Arjun Verma', 'SwiftBasket Commerce', 'shipper', 'growth'),
  ('isha.shipper03@freightiq.demo', 'Isha Nair', 'Harvest Lane Foods', 'shipper', 'pro'),
  ('kabir.shipper04@freightiq.demo', 'Kabir Shah', 'UrbanCart Supply', 'shipper', 'growth'),
  ('anaya.shipper05@freightiq.demo', 'Anaya Joshi', 'Medisphere Distribution', 'shipper', 'pro'),
  ('rohan.shipper06@freightiq.demo', 'Rohan Batra', 'RetailForge India', 'shipper', 'growth'),
  ('diya.shipper07@freightiq.demo', 'Diya Kulkarni', 'FreshSpring Markets', 'shipper', 'growth'),
  ('vihaan.shipper08@freightiq.demo', 'Vihaan Arora', 'HomePort Living', 'shipper', 'pro'),
  ('sana.shipper09@freightiq.demo', 'Sana Qureshi', 'BlueShelf FMCG', 'shipper', 'growth'),
  ('advik.shipper10@freightiq.demo', 'Advik Malhotra', 'QuickReach Retail', 'shipper', 'growth'),
  ('tara.shipper11@freightiq.demo', 'Tara Menon', 'PharmaFlow Networks', 'shipper', 'pro'),
  ('krish.shipper12@freightiq.demo', 'Krish Iyer', 'MetroCart Wholesale', 'shipper', 'growth'),
  ('meera.shipper13@freightiq.demo', 'Meera Tandon', 'EcoCircle Goods', 'shipper', 'growth'),
  ('dev.shipper14@freightiq.demo', 'Dev Chawla', 'Velocity Commerce', 'shipper', 'growth'),
  ('nia.shipper15@freightiq.demo', 'Nia Bansal', 'PrimeNest Retailers', 'shipper', 'pro'),
  ('aarav.carrier01@freightiq.demo', 'Aarav Sethi', 'RapidHaul Carriers', 'carrier', 'growth'),
  ('kiara.carrier02@freightiq.demo', 'Kiara Dsouza', 'TransitPeak Logistics', 'carrier', 'carrier'),
  ('reyansh.carrier03@freightiq.demo', 'Reyansh Gill', 'GreenArc Transport', 'carrier', 'growth'),
  ('myra.carrier04@freightiq.demo', 'Myra Chopra', 'Atlas Freight Lines', 'carrier', 'pro'),
  ('anish.carrier05@freightiq.demo', 'Anish Saxena', 'RouteHive Mobility', 'carrier', 'growth'),
  ('avni.carrier06@freightiq.demo', 'Avni Deshmukh', 'HarborWing Cargo', 'carrier', 'pro'),
  ('yash.carrier07@freightiq.demo', 'Yash Bedi', 'SummitFleet Movers', 'carrier', 'growth'),
  ('siya.carrier08@freightiq.demo', 'Siya Puri', 'ZenRoute Logistics', 'carrier', 'growth'),
  ('nakul.carrier09@freightiq.demo', 'Nakul Ghosh', 'CargoVista Express', 'carrier', 'pro'),
  ('pihu.carrier10@freightiq.demo', 'Pihu Anand', 'OrbitLine Transport', 'carrier', 'growth');

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
from tmp_bulk_accounts account
where not exists (
  select 1
  from auth.users existing
  where existing.email = account.email
);

insert into public.profiles (id, email, full_name, company_name, role, subscription_tier)
select
  user_account.id,
  account.email,
  account.full_name,
  account.company_name,
  account.role,
  case
    when account.subscription_tier = 'carrier' then 'growth'
    else account.subscription_tier
  end
from tmp_bulk_accounts account
join auth.users user_account on user_account.email = account.email
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
    profile.company_name,
    row_number() over (order by profile.email) as carrier_rank
  from public.profiles profile
  join tmp_bulk_accounts account
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
  profile.owner_id,
  profile.company_name,
  14 + ((profile.carrier_rank * 3) % 24),
  case mod(profile.carrier_rank, 5)
    when 0 then array['truck', 'rail']::text[]
    when 1 then array['truck', 'sea']::text[]
    when 2 then array['truck', 'air']::text[]
    when 3 then array['truck', 'rail', 'sea']::text[]
    else array['truck']::text[]
  end,
  case mod(profile.carrier_rank, 5)
    when 0 then jsonb_build_array(
      jsonb_build_object('origin', 'Ahmedabad', 'destination', 'Mumbai', 'radius_km', 130),
      jsonb_build_object('origin', 'Mumbai', 'destination', 'Pune', 'radius_km', 95)
    )
    when 1 then jsonb_build_array(
      jsonb_build_object('origin', 'Chennai', 'destination', 'Bengaluru', 'radius_km', 100),
      jsonb_build_object('origin', 'Hyderabad', 'destination', 'Pune', 'radius_km', 130)
    )
    when 2 then jsonb_build_array(
      jsonb_build_object('origin', 'Delhi', 'destination', 'Lucknow', 'radius_km', 150),
      jsonb_build_object('origin', 'Delhi', 'destination', 'Jaipur', 'radius_km', 110)
    )
    when 3 then jsonb_build_array(
      jsonb_build_object('origin', 'Mumbai', 'destination', 'Nashik', 'radius_km', 95),
      jsonb_build_object('origin', 'Pune', 'destination', 'Hyderabad', 'radius_km', 125)
    )
    else jsonb_build_array(
      jsonb_build_object('origin', 'Delhi', 'destination', 'Jaipur', 'radius_km', 95),
      jsonb_build_object('origin', 'Ahmedabad', 'destination', 'Mumbai', 'radius_km', 125)
    )
  end,
  round((4.1 + (mod(profile.carrier_rank, 5) * 0.15))::numeric, 1)::float8,
  90 + (profile.carrier_rank * 31),
  true
from carrier_profiles profile;

create temp table tmp_bulk_load_specs on commit drop as
with shipper_profiles as (
  select
    profile.id as shipper_id,
    profile.email,
    profile.company_name,
    row_number() over (order by profile.email) as shipper_rank
  from public.profiles profile
  join tmp_bulk_accounts account
    on account.email = profile.email
   and account.role = 'shipper'
),
load_templates as (
  select *
  from (
    values
      (
        1,
        'Metro replenishment wave',
        'Ahmedabad North DC',
        23.0370::float8,
        72.5660::float8,
        'Mumbai Retail Grid',
        19.0760::float8,
        72.8777::float8,
        530.0::float8,
        9200.0::float8,
        28.0::float8,
        'consumer_goods',
        1550.0::float8,
        'truck',
        'open',
        null::text,
        2,
        4,
        18
      ),
      (
        2,
        'Cold-chain response lane',
        'Nashik Agro Park',
        19.9975::float8,
        73.7898::float8,
        'Navi Mumbai Food Terminal',
        19.0330::float8,
        73.0297::float8,
        185.0::float8,
        7100.0::float8,
        20.0::float8,
        'perishables',
        1220.0::float8,
        'truck',
        'matched',
        'matched',
        1,
        2,
        14
      ),
      (
        3,
        'Northern healthcare shuttle',
        'Delhi Pharma Zone',
        28.6139::float8,
        77.2090::float8,
        'Lucknow Medical Cluster',
        26.8467::float8,
        80.9462::float8,
        555.0::float8,
        3400.0::float8,
        12.0::float8,
        'pharma',
        2140.0::float8,
        'air',
        'in_transit',
        'picked_up',
        0,
        1,
        36
      ),
      (
        4,
        'Capital retail relay',
        'Delhi Consumer Hub',
        28.7041::float8,
        77.1025::float8,
        'Jaipur Market Depot',
        26.9124::float8,
        75.7873::float8,
        305.0::float8,
        8600.0::float8,
        26.0::float8,
        'fmcg',
        1380.0::float8,
        'truck',
        'in_transit',
        'in_transit',
        -1,
        1,
        52
      ),
      (
        5,
        'South corridor export prep',
        'Chennai Export Yard',
        13.0827::float8,
        80.2707::float8,
        'Bengaluru Crossdock',
        12.9716::float8,
        77.5946::float8,
        347.0::float8,
        7800.0::float8,
        24.0::float8,
        'home_goods',
        1260.0::float8,
        'truck',
        'delivered',
        'delivered',
        -4,
        -2,
        108
      ),
      (
        6,
        'Deccan replenishment loop',
        'Hyderabad Commerce Park',
        17.3850::float8,
        78.4867::float8,
        'Pune Distribution Campus',
        18.5204::float8,
        73.8567::float8,
        560.0::float8,
        10400.0::float8,
        31.0::float8,
        'electronics',
        1680.0::float8,
        'truck',
        'matched',
        'matched',
        1,
        3,
        22
      )
  ) as template (
    template_rank,
    title_base,
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
    budget_usd,
    preferred_mode,
    load_status,
    shipment_status,
    pickup_offset_days,
    delivery_offset_days,
    created_hours_ago
  )
)
select
  shipper.shipper_id,
  shipper.email as shipper_email,
  format('Bulk Seed %s - %s', template.title_base, shipper.company_name) as title,
  template.origin_address,
  template.origin_lat,
  template.origin_lng,
  template.destination_address,
  template.destination_lat,
  template.destination_lng,
  template.distance_km,
  template.weight_kg,
  template.volume_m3,
  template.freight_type,
  current_date + template.pickup_offset_days as pickup_date,
  current_date + template.delivery_offset_days as delivery_date,
  template.budget_usd + ((shipper.shipper_rank - 1) * 12)::float8 as budget_usd,
  template.load_status,
  round(
    (
      template.distance_km *
      (template.weight_kg / 1000.0) *
      case template.preferred_mode
        when 'rail' then 0.028
        when 'sea' then 0.017
        when 'air' then 0.41
        else 0.096
      end
    )::numeric,
    1
  )::float8 as co2_score,
  template.preferred_mode,
  template.shipment_status,
  now() - make_interval(hours => (template.created_hours_ago + shipper.shipper_rank)::int) as created_at
from shipper_profiles shipper
cross join load_templates template;

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
  spec.shipper_id,
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
from tmp_bulk_load_specs spec
where not exists (
  select 1
  from public.loads existing
  where existing.shipper_id = spec.shipper_id
    and existing.title = spec.title
);

create temp table tmp_bulk_load_rows on commit drop as
select
  load.id,
  spec.shipper_id,
  spec.shipper_email,
  spec.title,
  spec.origin_address,
  spec.destination_address,
  spec.distance_km,
  spec.weight_kg,
  spec.budget_usd,
  spec.co2_score,
  spec.preferred_mode,
  spec.shipment_status,
  spec.created_at
from tmp_bulk_load_specs spec
join public.loads load
  on load.shipper_id = spec.shipper_id
 and load.title = spec.title;

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
  load.id,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.096)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.028)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.017)::numeric, 1)::float8,
  round((load.distance_km * (load.weight_kg / 1000.0) * 0.41)::numeric, 1)::float8,
  load.budget_usd,
  round((load.budget_usd * 0.91)::numeric, 1)::float8,
  round((load.budget_usd * 0.87)::numeric, 1)::float8,
  round((load.budget_usd * 1.63)::numeric, 1)::float8,
  round((1.2 + (load.distance_km / 420.0))::numeric, 1)::float8,
  round((1.8 + (load.distance_km / 360.0))::numeric, 1)::float8,
  round((3.1 + (load.distance_km / 290.0))::numeric, 1)::float8,
  round((0.4 + (load.distance_km / 900.0))::numeric, 1)::float8,
  load.created_at + interval '10 minutes'
from tmp_bulk_load_rows load
where not exists (
  select 1
  from public.modal_comparisons modal
  where modal.load_id = load.id
);

with carrier_pool as (
  select
    carrier.id,
    row_number() over (order by carrier.created_at, carrier.id) as carrier_rank,
    count(*) over () as carrier_count
  from public.carriers carrier
),
eligible_loads as (
  select
    load.*,
    row_number() over (order by load.created_at, load.id) as load_rank
  from tmp_bulk_load_rows load
  where load.shipment_status is not null
    and not exists (
      select 1
      from public.shipments shipment
      where shipment.load_id = load.id
        and shipment.status <> 'cancelled'
    )
),
assigned_shipments as (
  select
    load.*,
    carrier.id as carrier_id
  from eligible_loads load
  join carrier_pool carrier
    on carrier.carrier_rank = (((load.load_rank - 1) % carrier.carrier_count) + 1)
)
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
  assigned.id,
  assigned.carrier_id,
  round(
    (assigned.budget_usd * case assigned.shipment_status
      when 'delivered' then 0.96
      when 'in_transit' then 0.98
      when 'picked_up' then 0.99
      else 0.97
    end)::numeric,
    1
  )::float8,
  assigned.preferred_mode,
  assigned.co2_score,
  assigned.distance_km,
  assigned.shipment_status,
  case assigned.shipment_status
    when 'matched' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      )
    )
    when 'picked_up' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up and leaving origin hub',
        'timestamp', to_char(assigned.created_at + interval '12 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      )
    )
    when 'in_transit' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up from origin facility',
        'timestamp', to_char(assigned.created_at + interval '10 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment crossed the mid-route checkpoint',
        'timestamp', to_char(assigned.created_at + interval '1 day 4 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      )
    )
    else jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up from origin facility',
        'timestamp', to_char(assigned.created_at + interval '10 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment cleared final transit hub',
        'timestamp', to_char(assigned.created_at + interval '1 day 2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      ),
      jsonb_build_object(
        'status', 'delivered',
        'label', 'Shipment delivered successfully',
        'timestamp', to_char(assigned.created_at + interval '2 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      )
    )
  end,
  case assigned.shipment_status
    when 'matched' then assigned.created_at + interval '2 days'
    when 'picked_up' then assigned.created_at + interval '1 day 8 hours'
    when 'in_transit' then assigned.created_at + interval '18 hours'
    else assigned.created_at + interval '2 days'
  end,
  case
    when assigned.shipment_status = 'delivered' then assigned.created_at + interval '2 days'
    else null
  end,
  assigned.created_at + interval '2 hours'
from assigned_shipments assigned;

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
    when shipment.status = 'delivered' then round((shipment.co2_kg * 0.28)::numeric, 1)::float8
    when shipment.status = 'in_transit' then round((shipment.co2_kg * 0.10)::numeric, 1)::float8
    when shipment.status = 'picked_up' then round((shipment.co2_kg * 0.04)::numeric, 1)::float8
    else 0::float8
  end,
  shipment.created_at + interval '20 minutes'
from public.shipments shipment
join public.loads load on load.id = shipment.load_id
where load.title like 'Bulk Seed %'
  and not exists (
    select 1
    from public.co2_records record
    where record.shipment_id = shipment.id
  );

commit;
