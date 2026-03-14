begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from auth.users
    where id = '11111111-1111-1111-1111-111111111111'::uuid
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
      '11111111-1111-1111-1111-111111111111'::uuid,
      'authenticated',
      'authenticated',
      'ava.shipper@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ava Sharma","company_name":"Green Retail Logistics","role":"shipper"}'::jsonb,
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
    where id = '22222222-2222-2222-2222-222222222222'::uuid
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
      '22222222-2222-2222-2222-222222222222'::uuid,
      'authenticated',
      'authenticated',
      'noah.shipper@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Noah Mehta","company_name":"FreshChain Foods","role":"shipper"}'::jsonb,
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
    where id = '33333333-3333-3333-3333-333333333333'::uuid
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
      '33333333-3333-3333-3333-333333333333'::uuid,
      'authenticated',
      'authenticated',
      'liam.carrier@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Liam Patel","company_name":"BlueLine Transport","role":"carrier"}'::jsonb,
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
    where id = '44444444-4444-4444-4444-444444444444'::uuid
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
      '44444444-4444-4444-4444-444444444444'::uuid,
      'authenticated',
      'authenticated',
      'mia.carrier@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mia Singh","company_name":"EcoHaul Freight","role":"carrier"}'::jsonb,
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
    where id = '55555555-5555-5555-5555-555555555555'::uuid
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
      '55555555-5555-5555-5555-555555555555'::uuid,
      'authenticated',
      'authenticated',
      'aria.admin@freightiq.demo',
      extensions.crypt('SeedDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Aria Thomas","company_name":"FreightIQ Ops","role":"admin"}'::jsonb,
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
    '11111111-1111-1111-1111-111111111111'::uuid,
    'ava.shipper@freightiq.demo',
    'Ava Sharma',
    'Green Retail Logistics',
    'shipper',
    'pro'
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'noah.shipper@freightiq.demo',
    'Noah Mehta',
    'FreshChain Foods',
    'shipper',
    'growth'
  ),
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'liam.carrier@freightiq.demo',
    'Liam Patel',
    'BlueLine Transport',
    'carrier',
    'growth'
  ),
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    'mia.carrier@freightiq.demo',
    'Mia Singh',
    'EcoHaul Freight',
    'carrier',
    'pro'
  ),
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    'aria.admin@freightiq.demo',
    'Aria Thomas',
    'FreightIQ Ops',
    'admin',
    'enterprise'
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
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'BlueLine Transport',
    28,
    array['truck', 'rail']::text[],
    '[
      {"origin":"Ahmedabad","destination":"Mumbai","radius_km":120},
      {"origin":"Mumbai","destination":"Pune","radius_km":80},
      {"origin":"Nashik","destination":"Ahmedabad","radius_km":100}
    ]'::jsonb,
    4.6,
    312,
    true
  ),
  (
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'EcoHaul Freight',
    16,
    array['truck', 'sea']::text[],
    '[
      {"origin":"Mumbai","destination":"Chennai","radius_km":150},
      {"origin":"Chennai","destination":"Bengaluru","radius_km":90},
      {"origin":"Pune","destination":"Hyderabad","radius_km":110}
    ]'::jsonb,
    4.9,
    188,
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
    '10000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Electronics pallets for West distribution',
    'Ahmedabad Warehouse Zone 4',
    23.0225,
    72.5714,
    'Mumbai Retail Hub',
    19.0760,
    72.8777,
    12000,
    38.5,
    'electronics',
    date '2026-03-18',
    date '2026-03-20',
    1850,
    'open',
    410.5,
    'truck',
    timestamptz '2026-03-14 09:00:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000002'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Cold-chain produce for Mumbai market',
    'Nashik Agro Park',
    19.9975,
    73.7898,
    'Navi Mumbai Food Terminal',
    19.0330,
    73.0297,
    8000,
    24.0,
    'perishables',
    date '2026-03-16',
    date '2026-03-17',
    1325,
    'matched',
    188.2,
    'truck',
    timestamptz '2026-03-13 07:30:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000003'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'FMCG cartons to southern DC',
    'Pune Fulfillment Center',
    18.5204,
    73.8567,
    'Hyderabad Consumer Hub',
    17.3850,
    78.4867,
    10500,
    31.2,
    'fmcg',
    date '2026-03-12',
    date '2026-03-14',
    1690,
    'in_transit',
    356.4,
    'truck',
    timestamptz '2026-03-11 10:15:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000004'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Home goods shipment for export staging',
    'Chennai Industrial Estate',
    13.0827,
    80.2707,
    'Bengaluru Crossdock',
    12.9716,
    77.5946,
    6500,
    20.4,
    'home_goods',
    date '2026-03-08',
    date '2026-03-10',
    1210,
    'delivered',
    144.1,
    'truck',
    timestamptz '2026-03-07 13:20:00+00'
  ),
  (
    '10000000-0000-0000-0000-000000000005'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Cancelled seasonal apparel movement',
    'Surat Textile Market',
    21.1702,
    72.8311,
    'Jaipur Fashion Warehouse',
    26.9124,
    75.7873,
    5400,
    18.0,
    'apparel',
    date '2026-03-06',
    date '2026-03-09',
    980,
    'cancelled',
    221.9,
    'rail',
    timestamptz '2026-03-05 08:45:00+00'
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
    '20000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    410.5,
    119.7,
    68.4,
    2572.8,
    1850,
    1760,
    1640,
    4520,
    2.0,
    2.8,
    4.5,
    0.6,
    timestamptz '2026-03-14 09:01:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    188.2,
    54.9,
    31.4,
    1179.4,
    1325,
    1240,
    1185,
    2680,
    1.0,
    1.6,
    3.1,
    0.4,
    timestamptz '2026-03-13 07:31:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    356.4,
    103.9,
    59.4,
    2235.4,
    1690,
    1595,
    1510,
    3980,
    1.7,
    2.6,
    4.2,
    0.7,
    timestamptz '2026-03-11 10:16:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000004'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    144.1,
    42.0,
    24.0,
    903.1,
    1210,
    1135,
    1090,
    2100,
    1.1,
    1.8,
    2.9,
    0.5,
    timestamptz '2026-03-07 13:21:00+00'
  ),
  (
    '20000000-0000-0000-0000-000000000005'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    221.9,
    64.7,
    37.0,
    1392.7,
    980,
    910,
    870,
    2440,
    1.9,
    2.7,
    4.8,
    0.6,
    timestamptz '2026-03-05 08:46:00+00'
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
    '30000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
    1290,
    'truck',
    188.2,
    245.0,
    'matched',
    '[
      {"status":"matched","label":"Carrier accepted load","timestamp":"2026-03-13T09:10:00Z","location":"Nashik"}
    ]'::jsonb,
    timestamptz '2026-03-16 17:00:00+00',
    null,
    timestamptz '2026-03-13 09:10:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000002'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid,
    1655,
    'truck',
    356.4,
    560.0,
    'in_transit',
    '[
      {"status":"matched","label":"Carrier confirmed assignment","timestamp":"2026-03-11T12:00:00Z","location":"Pune"},
      {"status":"picked_up","label":"Shipment picked up","timestamp":"2026-03-12T05:30:00Z","location":"Pune"},
      {"status":"in_transit","label":"Reached Solapur transit hub","timestamp":"2026-03-13T14:40:00Z","location":"Solapur"}
    ]'::jsonb,
    timestamptz '2026-03-14 20:00:00+00',
    null,
    timestamptz '2026-03-11 12:00:00+00'
  ),
  (
    '30000000-0000-0000-0000-000000000003'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbb2'::uuid,
    1185,
    'truck',
    144.1,
    347.0,
    'delivered',
    '[
      {"status":"matched","label":"Carrier confirmed assignment","timestamp":"2026-03-07T15:00:00Z","location":"Chennai"},
      {"status":"picked_up","label":"Shipment loaded","timestamp":"2026-03-08T06:20:00Z","location":"Chennai"},
      {"status":"in_transit","label":"Crossed Hosur corridor","timestamp":"2026-03-09T03:15:00Z","location":"Hosur"},
      {"status":"delivered","label":"Shipment delivered","timestamp":"2026-03-10T11:05:00Z","location":"Bengaluru"}
    ]'::jsonb,
    timestamptz '2026-03-10 12:00:00+00',
    timestamptz '2026-03-10 11:05:00+00',
    timestamptz '2026-03-07 15:00:00+00'
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
    '40000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'truck',
    245.0,
    8000,
    188.2,
    false,
    0,
    timestamptz '2026-03-13 09:12:00+00'
  ),
  (
    '40000000-0000-0000-0000-000000000002'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'truck',
    560.0,
    10500,
    356.4,
    true,
    120.0,
    timestamptz '2026-03-11 12:05:00+00'
  ),
  (
    '40000000-0000-0000-0000-000000000003'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'truck',
    347.0,
    6500,
    144.1,
    true,
    60.0,
    timestamptz '2026-03-10 11:06:00+00'
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
