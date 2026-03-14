begin;

create extension if not exists pgcrypto;

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
  missing.owner_id,
  missing.company_name,
  missing.fleet_size,
  missing.service_modes,
  missing.coverage_corridors,
  missing.rating,
  missing.total_deliveries,
  true
from (
  select
    p.id as owner_id,
    coalesce(p.company_name, initcap(split_part(p.email, '@', 1)) || ' Carrier') as company_name,
    case (row_number() over (order by p.created_at, p.id) % 3)
      when 1 then 18
      when 2 then 26
      else 34
    end as fleet_size,
    case (row_number() over (order by p.created_at, p.id) % 3)
      when 1 then array['truck', 'rail']::text[]
      when 2 then array['truck', 'sea']::text[]
      else array['truck', 'air']::text[]
    end as service_modes,
    case (row_number() over (order by p.created_at, p.id) % 3)
      when 1 then jsonb_build_array(
        jsonb_build_object('origin', 'Mumbai', 'destination', 'Ahmedabad', 'radius_km', 110),
        jsonb_build_object('origin', 'Mumbai', 'destination', 'Pune', 'radius_km', 75)
      )
      when 2 then jsonb_build_array(
        jsonb_build_object('origin', 'Chennai', 'destination', 'Bengaluru', 'radius_km', 95),
        jsonb_build_object('origin', 'Hyderabad', 'destination', 'Pune', 'radius_km', 115)
      )
      else jsonb_build_array(
        jsonb_build_object('origin', 'Delhi', 'destination', 'Jaipur', 'radius_km', 100),
        jsonb_build_object('origin', 'Delhi', 'destination', 'Lucknow', 'radius_km', 140)
      )
    end as coverage_corridors,
    round((4.1 + ((row_number() over (order by p.created_at, p.id) % 4) * 0.2))::numeric, 1)::float8 as rating,
    120 + ((row_number() over (order by p.created_at, p.id) * 27)::int) as total_deliveries
  from public.profiles p
  left join public.carriers c on c.owner_id = p.id
  where p.role = 'carrier'
    and c.id is null
) as missing;

with shipper_profiles as (
  select
    p.id,
    p.email,
    p.company_name,
    row_number() over (order by p.created_at, p.id) as shipper_rank
  from public.profiles p
  where p.role = 'shipper'
),
load_templates as (
  select *
  from (
    values
      (
        1,
        'Regional replenishment lane',
        'Mundra Consolidation Center',
        22.8390::float8,
        69.7220::float8,
        'Ahmedabad Retail Cluster',
        23.0225::float8,
        72.5714::float8,
        380.0::float8,
        9200.0::float8,
        28.0::float8,
        'consumer_goods',
        1480.0::float8,
        'open',
        4,
        6,
        2
      ),
      (
        2,
        'Fresh inventory transfer',
        'Pune Distribution Campus',
        18.5204::float8,
        73.8567::float8,
        'Mumbai Retail Network',
        19.0760::float8,
        72.8777::float8,
        165.0::float8,
        6100.0::float8,
        19.0::float8,
        'perishables',
        1185.0::float8,
        'matched',
        1,
        2,
        4
      ),
      (
        3,
        'Medical dispatch corridor',
        'Delhi Pharma Zone',
        28.6139::float8,
        77.2090::float8,
        'Lucknow Healthcare Depot',
        26.8467::float8,
        80.9462::float8,
        555.0::float8,
        4300.0::float8,
        11.5::float8,
        'pharma',
        1760.0::float8,
        'in_transit',
        -1,
        1,
        6
      ),
      (
        4,
        'Finished goods retail run',
        'Chennai Export Yard',
        13.0827::float8,
        80.2707::float8,
        'Bengaluru Crossdock',
        12.9716::float8,
        77.5946::float8,
        347.0::float8,
        7600.0::float8,
        24.0::float8,
        'home_goods',
        1265.0::float8,
        'delivered',
        -5,
        -3,
        9
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
    load_status,
    pickup_offset_days,
    delivery_offset_days,
    created_days_ago
  )
),
generated_loads as (
  select
    shipper.id as shipper_id,
    format(
      'Seeded %s for %s',
      template.title_base,
      coalesce(shipper.company_name, initcap(split_part(shipper.email, '@', 1)))
    ) as title,
    template.origin_address,
    template.origin_lat,
    template.origin_lng,
    template.destination_address,
    template.destination_lat,
    template.destination_lng,
    template.weight_kg,
    template.volume_m3,
    template.freight_type,
    current_date + template.pickup_offset_days as pickup_date,
    current_date + template.delivery_offset_days as delivery_date,
    template.budget_usd,
    template.load_status,
    round((template.distance_km * (template.weight_kg / 1000.0) * 0.096)::numeric, 1)::float8 as co2_score,
    'truck'::text as preferred_mode,
    now() - make_interval(days => (template.created_days_ago + shipper.shipper_rank)::int) as created_at
  from shipper_profiles shipper
  cross join load_templates template
)
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
  generated.shipper_id,
  generated.title,
  generated.origin_address,
  generated.origin_lat,
  generated.origin_lng,
  generated.destination_address,
  generated.destination_lat,
  generated.destination_lng,
  generated.weight_kg,
  generated.volume_m3,
  generated.freight_type,
  generated.pickup_date,
  generated.delivery_date,
  generated.budget_usd,
  generated.load_status,
  generated.co2_score,
  generated.preferred_mode,
  generated.created_at
from generated_loads generated
where not exists (
  select 1
  from public.loads existing
  where existing.shipper_id = generated.shipper_id
    and existing.title = generated.title
);

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
  l.id,
  round(coalesce(l.co2_score, 0)::numeric, 1)::float8,
  round((coalesce(l.co2_score, 0) * 0.31)::numeric, 1)::float8,
  round((coalesce(l.co2_score, 0) * 0.18)::numeric, 1)::float8,
  round((coalesce(l.co2_score, 0) * 5.65)::numeric, 1)::float8,
  l.budget_usd,
  round((coalesce(l.budget_usd, 0) * 0.93)::numeric, 1)::float8,
  round((coalesce(l.budget_usd, 0) * 0.88)::numeric, 1)::float8,
  round((coalesce(l.budget_usd, 0) * 1.74)::numeric, 1)::float8,
  2.4::float8,
  3.2::float8,
  5.1::float8,
  0.8::float8,
  l.created_at + interval '5 minutes'
from public.loads l
where l.title like 'Seeded %'
  and not exists (
    select 1
    from public.modal_comparisons modal
    where modal.load_id = l.id
  );

with carrier_pool as (
  select
    c.id,
    row_number() over (order by c.created_at, c.id) as carrier_rank,
    count(*) over () as carrier_count
  from public.carriers c
),
eligible_loads as (
  select
    l.id as load_id,
    l.title,
    l.shipper_id,
    l.origin_address,
    l.destination_address,
    l.weight_kg,
    l.budget_usd,
    l.co2_score,
    l.status,
    l.created_at,
    row_number() over (order by l.created_at, l.id) as load_rank
  from public.loads l
  where l.title like 'Seeded %'
    and l.status in ('matched', 'in_transit', 'delivered')
    and not exists (
      select 1
      from public.shipments shipment
      where shipment.load_id = l.id
        and shipment.status <> 'cancelled'
    )
),
assigned_shipments as (
  select
    load.load_id,
    load.title,
    load.shipper_id,
    load.origin_address,
    load.destination_address,
    load.weight_kg,
    load.budget_usd,
    load.co2_score,
    load.status,
    load.created_at,
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
  assigned.load_id,
  assigned.carrier_id,
  round((coalesce(assigned.budget_usd, 0) * 0.97)::numeric, 1)::float8,
  'truck',
  assigned.co2_score,
  case
    when assigned.weight_kg is not null
      and assigned.weight_kg > 0
      and assigned.co2_score is not null
    then round((assigned.co2_score / ((assigned.weight_kg / 1000.0) * 0.096))::numeric, 1)::float8
    else null
  end,
  assigned.status,
  case assigned.status
    when 'matched' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier assigned to seeded shipment',
        'timestamp', to_char(assigned.created_at + interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      )
    )
    when 'in_transit' then jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up from origin',
        'timestamp', to_char(assigned.created_at + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment reached mid-route checkpoint',
        'timestamp', to_char(assigned.created_at + interval '2 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      )
    )
    else jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier confirmed assignment',
        'timestamp', to_char(assigned.created_at + interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment loaded for dispatch',
        'timestamp', to_char(assigned.created_at + interval '1 day', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.origin_address
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment crossed final transit hub',
        'timestamp', to_char(assigned.created_at + interval '2 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      ),
      jsonb_build_object(
        'status', 'delivered',
        'label', 'Shipment delivered successfully',
        'timestamp', to_char(assigned.created_at + interval '3 days', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', assigned.destination_address
      )
    )
  end,
  case assigned.status
    when 'matched' then now() + interval '2 days'
    when 'in_transit' then now() + interval '1 day'
    else now() - interval '1 day'
  end,
  case
    when assigned.status = 'delivered' then now() - interval '1 day'
    else null
  end,
  assigned.created_at + interval '6 hours'
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
  coalesce(shipment.distance_km, 0),
  coalesce(load.weight_kg, 0),
  coalesce(shipment.co2_kg, load.co2_score, 0),
  shipment.status = 'delivered',
  case
    when shipment.status = 'delivered' then round((coalesce(shipment.co2_kg, load.co2_score, 0) * 0.22)::numeric, 1)::float8
    when shipment.status = 'in_transit' then round((coalesce(shipment.co2_kg, load.co2_score, 0) * 0.08)::numeric, 1)::float8
    else 0::float8
  end,
  shipment.created_at + interval '30 minutes'
from public.shipments shipment
join public.loads load on load.id = shipment.load_id
where load.title like 'Seeded %'
  and not exists (
    select 1
    from public.co2_records record
    where record.shipment_id = shipment.id
  );

commit;
