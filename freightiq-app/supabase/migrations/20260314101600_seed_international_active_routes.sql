begin;

create extension if not exists pgcrypto;

create temp table tmp_international_context on commit drop as
select
  (
    select profile.id
    from public.profiles profile
    where profile.role = 'shipper'
    order by (profile.email = 'ava.shipper@freightiq.demo') desc, profile.created_at asc, profile.id asc
    limit 1
  ) as shipper_id,
  (
    select carrier.id
    from public.carriers carrier
    join public.profiles owner on owner.id = carrier.owner_id
    where owner.role = 'carrier'
    order by (owner.email = 'liam.carrier@freightiq.demo') desc, carrier.created_at asc, carrier.id asc
    limit 1
  ) as carrier_id;

update public.carriers carrier
set service_modes = (
  select array_agg(distinct mode order by mode)
  from unnest(coalesce(carrier.service_modes, array[]::text[]) || array['sea', 'air']::text[]) as mode
)
where carrier.id = (select ctx.carrier_id from tmp_international_context ctx)
  and exists (select 1 from tmp_international_context ctx where ctx.carrier_id is not null);

create temp table tmp_international_specs (
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
  budget_usd float8 not null,
  transport_mode text not null,
  co2_score float8 not null,
  checkpoint_label text not null,
  checkpoint_location text not null,
  eta_hours int not null,
  created_at timestamptz not null
) on commit drop;

insert into tmp_international_specs (
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
  budget_usd,
  transport_mode,
  co2_score,
  checkpoint_label,
  checkpoint_location,
  eta_hours,
  created_at
)
values
  (
    'Intl Active Sea 01 - Mumbai to Dubai',
    'Jawaharlal Nehru Port, Navi Mumbai, India',
    18.9498,
    72.9483,
    'Jebel Ali Port, Dubai, UAE',
    25.0110,
    55.0620,
    1920,
    18000,
    46,
    'consumer_goods',
    4200,
    'sea',
    553.0,
    'Container vessel cleared Arabian Sea lane',
    'Arabian Sea shipping lane',
    80,
    now() - interval '34 hours'
  ),
  (
    'Intl Active Sea 02 - Chennai to Port Klang',
    'Chennai Port, Chennai, India',
    13.0827,
    80.2870,
    'Port Klang, Selangor, Malaysia',
    2.9996,
    101.3920,
    2940,
    15000,
    41,
    'electronics',
    5100,
    'sea',
    706.0,
    'Vessel reached Andaman sea corridor',
    'Andaman Sea corridor',
    118,
    now() - interval '32 hours'
  ),
  (
    'Intl Active Sea 03 - Mundra to Rotterdam',
    'Mundra Port, Gujarat, India',
    22.8390,
    69.7210,
    'Port of Rotterdam, Netherlands',
    51.9500,
    4.1400,
    6700,
    24000,
    58,
    'industrial_parts',
    9200,
    'sea',
    2572.8,
    'Cargo crossed Gulf of Aden checkpoint',
    'Gulf of Aden',
    264,
    now() - interval '30 hours'
  ),
  (
    'Intl Active Sea 04 - Vizag to Colombo',
    'Visakhapatnam Port, India',
    17.6868,
    83.2185,
    'Port of Colombo, Sri Lanka',
    6.9500,
    79.8500,
    1220,
    12000,
    32,
    'agri_exports',
    3300,
    'sea',
    234.2,
    'Shipment entered Bay of Bengal coastal route',
    'Bay of Bengal',
    62,
    now() - interval '28 hours'
  ),
  (
    'Intl Active Sea 05 - Kochi to Mombasa',
    'Cochin Port, Kochi, India',
    9.9660,
    76.2710,
    'Port of Mombasa, Kenya',
    -4.0430,
    39.6680,
    4300,
    20000,
    54,
    'textiles',
    7600,
    'sea',
    1376.0,
    'Fleet crossed western Indian Ocean route',
    'Western Indian Ocean corridor',
    176,
    now() - interval '26 hours'
  ),
  (
    'Intl Active Air 01 - Delhi to Frankfurt',
    'Indira Gandhi International Airport, Delhi, India',
    28.5562,
    77.1000,
    'Frankfurt Airport, Germany',
    50.0379,
    8.5622,
    6110,
    1800,
    8,
    'pharma',
    12800,
    'air',
    6598.8,
    'ULD transfer completed at Gulf air hub',
    'Doha International transit airside',
    14,
    now() - interval '12 hours'
  ),
  (
    'Intl Active Air 02 - Mumbai to Dubai',
    'Chhatrapati Shivaji Maharaj International Airport, Mumbai, India',
    19.0896,
    72.8656,
    'Dubai International Airport, UAE',
    25.2532,
    55.3657,
    1930,
    1200,
    6,
    'electronics',
    7800,
    'air',
    1389.6,
    'Air cargo departed Arabian Gulf approach',
    'Arabian Gulf air corridor',
    8,
    now() - interval '10 hours'
  ),
  (
    'Intl Active Air 03 - Bengaluru to Singapore',
    'Kempegowda International Airport, Bengaluru, India',
    13.1986,
    77.7066,
    'Singapore Changi Airport, Singapore',
    1.3644,
    103.9915,
    3180,
    1400,
    7,
    'semiconductors',
    9400,
    'air',
    2671.2,
    'Shipment crossed Malacca FIR checkpoint',
    'Malacca Strait air corridor',
    9,
    now() - interval '9 hours'
  ),
  (
    'Intl Active Air 04 - Hyderabad to London',
    'Rajiv Gandhi International Airport, Hyderabad, India',
    17.2403,
    78.4294,
    'London Heathrow Airport, UK',
    51.4700,
    -0.4543,
    7760,
    1100,
    5,
    'medical_devices',
    15400,
    'air',
    5121.6,
    'Freighter crossed European control zone',
    'Central Europe air corridor',
    16,
    now() - interval '8 hours'
  ),
  (
    'Intl Active Air 05 - Chennai to Sydney',
    'Chennai International Airport, India',
    12.9941,
    80.1709,
    'Sydney Kingsford Smith Airport, Australia',
    -33.9399,
    151.1753,
    9150,
    1600,
    9,
    'auto_components',
    18200,
    'air',
    8784.0,
    'Shipment crossed western Australia waypoint',
    'Western Australia air corridor',
    20,
    now() - interval '7 hours'
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
  ctx.shipper_id,
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
  current_date - 1,
  current_date + greatest(1, ceil(spec.eta_hours::numeric / 24.0)::int),
  spec.budget_usd,
  'in_transit',
  spec.co2_score,
  spec.transport_mode,
  spec.created_at
from tmp_international_specs spec
cross join tmp_international_context ctx
where ctx.shipper_id is not null
  and ctx.carrier_id is not null
  and not exists (
    select 1
    from public.loads existing
    where existing.title = spec.title
  );

create temp table tmp_international_load_rows on commit drop as
select
  load.id as load_id,
  ctx.shipper_id,
  ctx.carrier_id,
  spec.title,
  spec.origin_address,
  spec.destination_address,
  spec.distance_km,
  spec.weight_kg,
  spec.budget_usd,
  spec.transport_mode,
  spec.co2_score,
  spec.checkpoint_label,
  spec.checkpoint_location,
  spec.eta_hours,
  spec.created_at
from tmp_international_specs spec
join public.loads load on load.title = spec.title
cross join tmp_international_context ctx
where ctx.shipper_id is not null
  and ctx.carrier_id is not null;

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
  round((load.budget_usd * 0.9)::numeric, 1)::float8,
  round((load.budget_usd * 0.83)::numeric, 1)::float8,
  round((load.budget_usd * 1.58)::numeric, 1)::float8,
  round((1.2 + (load.distance_km / 520.0))::numeric, 1)::float8,
  round((2.0 + (load.distance_km / 410.0))::numeric, 1)::float8,
  round((3.4 + (load.distance_km / 240.0))::numeric, 1)::float8,
  round((0.4 + (load.distance_km / 1050.0))::numeric, 1)::float8,
  load.created_at + interval '15 minutes'
from tmp_international_load_rows load
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
  load.carrier_id,
  round((load.budget_usd * 0.95)::numeric, 1)::float8,
  load.transport_mode,
  load.co2_score,
  load.distance_km,
  'in_transit',
  jsonb_build_array(
    jsonb_build_object(
      'status', 'matched',
      'label', 'Carrier confirmed international assignment',
      'timestamp', to_char(load.created_at + interval '1 hour', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'location', load.origin_address
    ),
    jsonb_build_object(
      'status', 'picked_up',
      'label', 'Shipment handed over at export terminal',
      'timestamp', to_char(load.created_at + interval '3 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'location', load.origin_address
    ),
    jsonb_build_object(
      'status', 'in_transit',
      'label', load.checkpoint_label,
      'timestamp', to_char(load.created_at + interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'location', load.checkpoint_location
    )
  ),
  load.created_at + make_interval(hours => load.eta_hours),
  null,
  load.created_at + interval '1 hour'
from tmp_international_load_rows load
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
  false,
  round((shipment.co2_kg * 0.08)::numeric, 1)::float8,
  shipment.created_at + interval '20 minutes'
from public.shipments shipment
join tmp_international_load_rows load on load.load_id = shipment.load_id
where not exists (
  select 1
  from public.co2_records record
  where record.shipment_id = shipment.id
);

commit;
