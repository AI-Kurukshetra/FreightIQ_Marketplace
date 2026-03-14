begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = '66666666-6666-6666-6666-666666666666'::uuid
  ) then
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
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      '66666666-6666-6666-6666-666666666666'::uuid,
      'authenticated',
      'authenticated',
      'ethan.shipper@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ethan Rao","company_name":"UrbanNest Commerce","role":"shipper"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  end if;

  if not exists (
    select 1
    from auth.users
    where id = '77777777-7777-7777-7777-777777777777'::uuid
  ) then
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
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      '77777777-7777-7777-7777-777777777777'::uuid,
      'authenticated',
      'authenticated',
      'zoe.carrier@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Zoe Khan","company_name":"SwiftRoute Logistics","role":"carrier"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  end if;
end
$$;

insert into public.profiles (id, email, full_name, company_name, role, subscription_tier)
values
  (
    '66666666-6666-6666-6666-666666666666'::uuid,
    'ethan.shipper@freightiq.demo',
    'Ethan Rao',
    'UrbanNest Commerce',
    'shipper',
    'growth'
  ),
  (
    '77777777-7777-7777-7777-777777777777'::uuid,
    'zoe.carrier@freightiq.demo',
    'Zoe Khan',
    'SwiftRoute Logistics',
    'carrier',
    'growth'
  )
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  company_name = excluded.company_name,
  role = excluded.role,
  subscription_tier = excluded.subscription_tier;

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
values
  (
    'ccccccc3-cccc-cccc-cccc-ccccccccccc3'::uuid,
    '77777777-7777-7777-7777-777777777777'::uuid,
    'SwiftRoute Logistics',
    22,
    array['truck', 'air']::text[],
    '[
      {"origin":"Delhi","destination":"Jaipur","radius_km":95},
      {"origin":"Delhi","destination":"Lucknow","radius_km":140},
      {"origin":"Jaipur","destination":"Indore","radius_km":125}
    ]'::jsonb,
    4.4,
    141,
    true
  )
on conflict (id) do update
set
  owner_id = excluded.owner_id,
  company_name = excluded.company_name,
  fleet_size = excluded.fleet_size,
  service_modes = excluded.service_modes,
  coverage_corridors = excluded.coverage_corridors,
  rating = excluded.rating,
  total_deliveries = excluded.total_deliveries,
  verified = excluded.verified;

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
values
  (
    '10000000-0000-0000-0000-000000000006'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'Furniture batch for NCR showroom rollout',
    'Delhi North Warehouse',
    28.7041,
    77.1025,
    'Jaipur Retail Park',
    26.9124,
    75.7873,
    9200,
    42.8,
    'furniture',
    date '2026-03-19',
    date '2026-03-20',
    1540,
    'open',
    172.8,
    'truck',
    timestamptz '2026-03-14 11:30:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000007'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'Personal care cartons to Lucknow',
    'Delhi Consumer Hub',
    28.6139,
    77.2090,
    'Lucknow Distribution Center',
    26.8467,
    80.9462,
    7100,
    19.5,
    'personal_care',
    date '2026-03-15',
    date '2026-03-16',
    1180,
    'matched',
    205.6,
    'truck',
    timestamptz '2026-03-14 06:40:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000008'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Apparel replenishment for Indore franchise',
    'Jaipur Fashion Hub',
    26.9124,
    75.7873,
    'Indore City Crossdock',
    22.7196,
    75.8577,
    4800,
    14.2,
    'apparel',
    date '2026-03-12',
    date '2026-03-13',
    960,
    'delivered',
    132.3,
    'truck',
    timestamptz '2026-03-10 15:10:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000009'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'High-priority pharma transfer',
    'Delhi Pharma Cold Store',
    28.5355,
    77.3910,
    'Chandigarh Medical Depot',
    30.7333,
    76.7794,
    2600,
    8.5,
    'pharma',
    date '2026-03-13',
    date '2026-03-13',
    2100,
    'in_transit',
    98.4,
    'air',
    timestamptz '2026-03-12 18:25:00+00'
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
values
  (
    '20000000-0000-0000-0000-000000000006'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    172.8,
    50.4,
    28.8,
    1083.6,
    1540,
    1475,
    1400,
    2980,
    1.0,
    1.6,
    3.0,
    0.4,
    timestamptz '2026-03-14 11:31:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000007'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    205.6,
    59.9,
    34.2,
    1289.3,
    1180,
    1110,
    1055,
    2860,
    1.1,
    1.8,
    3.2,
    0.4,
    timestamptz '2026-03-14 06:41:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000008'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    132.3,
    38.6,
    22.1,
    829.5,
    960,
    910,
    875,
    1930,
    0.9,
    1.5,
    2.6,
    0.3,
    timestamptz '2026-03-10 15:11:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000009'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    174.2,
    50.8,
    29.0,
    98.4,
    1240,
    1195,
    1150,
    2100,
    1.0,
    1.6,
    2.8,
    0.2,
    timestamptz '2026-03-12 18:26:00+00'
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
values
  (
    '30000000-0000-0000-0000-000000000004'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    'ccccccc3-cccc-cccc-cccc-ccccccccccc3'::uuid,
    1160,
    'truck',
    205.6,
    555.0,
    'matched',
    '[
      {"status":"matched","label":"Carrier confirmed assignment","timestamp":"2026-03-14T07:05:00Z","location":"Delhi"}
    ]'::jsonb,
    timestamptz '2026-03-16 16:00:00+00',
    null,
    timestamptz '2026-03-14 07:05:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000005'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    'ccccccc3-cccc-cccc-cccc-ccccccccccc3'::uuid,
    945,
    'truck',
    132.3,
    405.0,
    'delivered',
    '[
      {"status":"matched","label":"Carrier confirmed assignment","timestamp":"2026-03-10T16:00:00Z","location":"Jaipur"},
      {"status":"picked_up","label":"Shipment picked up","timestamp":"2026-03-11T04:30:00Z","location":"Jaipur"},
      {"status":"in_transit","label":"Reached Ujjain stop","timestamp":"2026-03-12T02:20:00Z","location":"Ujjain"},
      {"status":"delivered","label":"Shipment delivered","timestamp":"2026-03-13T09:40:00Z","location":"Indore"}
    ]'::jsonb,
    timestamptz '2026-03-13 12:00:00+00',
    timestamptz '2026-03-13 09:40:00+00',
    timestamptz '2026-03-10 16:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000006'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    'ccccccc3-cccc-cccc-cccc-ccccccccccc3'::uuid,
    2050,
    'air',
    98.4,
    240.0,
    'in_transit',
    '[
      {"status":"matched","label":"Air carrier booked","timestamp":"2026-03-12T19:05:00Z","location":"Delhi"},
      {"status":"picked_up","label":"Shipment handed to airport partner","timestamp":"2026-03-13T03:30:00Z","location":"Delhi Airport"},
      {"status":"in_transit","label":"Arrived at Chandigarh airside facility","timestamp":"2026-03-13T08:10:00Z","location":"Chandigarh"}
    ]'::jsonb,
    timestamptz '2026-03-13 11:00:00+00',
    null,
    timestamptz '2026-03-12 19:05:00+00'
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
values
  (
    '40000000-0000-0000-0000-000000000004'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '66666666-6666-6666-6666-666666666666'::uuid,
    'truck',
    555.0,
    7100,
    205.6,
    false,
    0,
    timestamptz '2026-03-14 07:06:00+00'
  ),
  (
    '40000000-0000-0000-0000-000000000005'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'truck',
    405.0,
    4800,
    132.3,
    true,
    45.0,
    timestamptz '2026-03-13 09:41:00+00'
  ),
  (
    '40000000-0000-0000-0000-000000000006'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'air',
    240.0,
    2600,
    98.4,
    true,
    30.0,
    timestamptz '2026-03-12 19:06:00+00'
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

commit;
