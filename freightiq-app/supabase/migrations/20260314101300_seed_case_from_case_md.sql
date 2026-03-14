-- Seed case from /case.md:
-- "Active Shipment + Live Route Map Test Case"
-- UP
begin;

do $$
declare
  v_shipper_id uuid;
  v_carrier_owner_id uuid;
  v_carrier_id uuid;
begin
  select id
    into v_shipper_id
  from public.profiles
  where role = 'shipper'
  order by (email = 'ava.shipper@freightiq.demo') desc, created_at asc, id asc
  limit 1;

  select id
    into v_carrier_owner_id
  from public.profiles
  where role = 'carrier'
  order by (email = 'liam.carrier@freightiq.demo') desc, created_at asc, id asc
  limit 1;

  if v_shipper_id is null or v_carrier_owner_id is null then
    raise notice 'Skipping case seed: missing shipper/carrier profile.';
    return;
  end if;

  insert into public.carriers (
    owner_id,
    company_name,
    fleet_size,
    service_modes,
    coverage_corridors,
    rating,
    total_deliveries,
    verified
  )
  values (
    v_carrier_owner_id,
    'CaseFlow Carrier Logistics',
    18,
    array['truck', 'ev_truck', 'van']::text[],
    '[
      {"origin":"Ahmedabad","destination":"Mumbai","radius_km":120},
      {"origin":"Mumbai","destination":"Pune","radius_km":90}
    ]'::jsonb,
    4.6,
    96,
    true
  )
  on conflict (owner_id) do update
  set
    company_name = excluded.company_name,
    fleet_size = excluded.fleet_size,
    service_modes = excluded.service_modes,
    coverage_corridors = excluded.coverage_corridors
  returning id into v_carrier_id;

  if v_carrier_id is null then
    select id
      into v_carrier_id
    from public.carriers
    where owner_id = v_carrier_owner_id
    limit 1;
  end if;

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
  values (
    'f1000000-0000-0000-0000-000000000001'::uuid,
    v_shipper_id,
    'Electronics pallets - Test Run',
    'Ahmedabad, Gujarat, India',
    23.0225,
    72.5714,
    'Mumbai, Maharashtra, India',
    19.0760,
    72.8777,
    9200,
    30.0,
    'electronics',
    current_date - 1,
    current_date + 1,
    1820,
    'in_transit',
    188.2,
    'truck',
    now() - interval '6 hours'
  )
  on conflict (id) do update
  set
    shipper_id = excluded.shipper_id,
    title = excluded.title,
    origin_address = excluded.origin_address,
    origin_lat = excluded.origin_lat,
    origin_lng = excluded.origin_lng,
    destination_address = excluded.destination_address,
    destination_lat = excluded.destination_lat,
    destination_lng = excluded.destination_lng,
    weight_kg = excluded.weight_kg,
    volume_m3 = excluded.volume_m3,
    freight_type = excluded.freight_type,
    pickup_date = excluded.pickup_date,
    delivery_date = excluded.delivery_date,
    budget_usd = excluded.budget_usd,
    status = excluded.status,
    co2_score = excluded.co2_score,
    preferred_mode = excluded.preferred_mode,
    created_at = excluded.created_at;

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
  values (
    'f2000000-0000-0000-0000-000000000001'::uuid,
    'f1000000-0000-0000-0000-000000000001'::uuid,
    188.2,
    55.0,
    31.4,
    1179.0,
    1820.0,
    1700.0,
    1630.0,
    2890.0,
    1.2,
    1.8,
    3.2,
    0.4,
    now() - interval '5 hours'
  )
  on conflict (load_id) do update
  set
    truck_co2 = excluded.truck_co2,
    rail_co2 = excluded.rail_co2,
    sea_co2 = excluded.sea_co2,
    air_co2 = excluded.air_co2,
    truck_cost = excluded.truck_cost,
    rail_cost = excluded.rail_cost,
    sea_cost = excluded.sea_cost,
    air_cost = excluded.air_cost,
    truck_days = excluded.truck_days,
    rail_days = excluded.rail_days,
    sea_days = excluded.sea_days,
    air_days = excluded.air_days,
    created_at = excluded.created_at;

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
  values (
    'f3000000-0000-0000-0000-000000000001'::uuid,
    'f1000000-0000-0000-0000-000000000001'::uuid,
    v_carrier_id,
    1765,
    'truck',
    188.2,
    525.0,
    'in_transit',
    jsonb_build_array(
      jsonb_build_object(
        'status', 'matched',
        'label', 'Carrier accepted the load assignment',
        'timestamp', to_char(now() - interval '6 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', 'Ahmedabad, Gujarat, India'
      ),
      jsonb_build_object(
        'status', 'picked_up',
        'label', 'Shipment picked up from origin',
        'timestamp', to_char(now() - interval '4 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', 'Ahmedabad, Gujarat, India'
      ),
      jsonb_build_object(
        'status', 'in_transit',
        'label', 'Shipment is actively moving across the route',
        'timestamp', to_char(now() - interval '2 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', 'Vadodara, Gujarat, India'
      )
    ),
    now() + interval '8 hours',
    null,
    now() - interval '6 hours'
  )
  on conflict (id) do update
  set
    load_id = excluded.load_id,
    carrier_id = excluded.carrier_id,
    agreed_price_usd = excluded.agreed_price_usd,
    transport_mode = excluded.transport_mode,
    co2_kg = excluded.co2_kg,
    distance_km = excluded.distance_km,
    status = excluded.status,
    tracking_updates = excluded.tracking_updates,
    estimated_delivery = excluded.estimated_delivery,
    actual_delivery = excluded.actual_delivery,
    created_at = excluded.created_at;

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
  values (
    'f4000000-0000-0000-0000-000000000001'::uuid,
    'f3000000-0000-0000-0000-000000000001'::uuid,
    v_shipper_id,
    'truck',
    525.0,
    9200.0,
    188.2,
    false,
    0.0,
    now() - interval '90 minutes'
  )
  on conflict (id) do update
  set
    shipment_id = excluded.shipment_id,
    shipper_id = excluded.shipper_id,
    transport_mode = excluded.transport_mode,
    distance_km = excluded.distance_km,
    weight_kg = excluded.weight_kg,
    co2_kg = excluded.co2_kg,
    offset_purchased = excluded.offset_purchased,
    offset_kg = excluded.offset_kg,
    recorded_at = excluded.recorded_at;
end
$$;

commit;

-- DOWN (manual rollback reference)
-- delete from public.co2_records where id = 'f4000000-0000-0000-0000-000000000001'::uuid;
-- delete from public.shipments where id = 'f3000000-0000-0000-0000-000000000001'::uuid;
-- delete from public.modal_comparisons where load_id = 'f1000000-0000-0000-0000-000000000001'::uuid;
-- delete from public.loads where id = 'f1000000-0000-0000-0000-000000000001'::uuid;
