begin;

create extension if not exists pgcrypto;

create temp table tmp_activity_specs (
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

insert into tmp_activity_specs (
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
  ('neel.shipper16@freightiq.demo','pranav.carrier11@freightiq.demo','Activity Batch EV retail wave 01','Ahmedabad Retail Fulfillment',23.0225,72.5714,'Mumbai Store Cluster',19.0760,72.8777,530,6400,18,'retail',current_date,current_date + 1,1340,'in_transit','ev_truck','in_transit',128.8,now() - interval '20 hours'),
  ('neel.shipper16@freightiq.demo','pranav.carrier11@freightiq.demo','Activity Batch EV retail wave 02','Pune Smart Warehouse',18.5204,73.8567,'Mumbai Urban Darkstore',19.0330,73.0297,168,4200,14,'grocery',current_date + 1,current_date + 2,980,'matched','ev_truck','matched',26.8,now() - interval '8 hours'),
  ('neel.shipper16@freightiq.demo','kavya.carrier12@freightiq.demo','Activity Batch Van drop NCR 01','Delhi Commerce Point',28.7041,77.1025,'Jaipur Market Hub',26.9124,75.7873,305,1800,7,'retail',current_date + 1,current_date + 1,690,'matched','van','matched',45.0,now() - interval '7 hours'),
  ('neel.shipper16@freightiq.demo','kavya.carrier12@freightiq.demo','Activity Batch Van drop NCR 02','Jaipur Med Store',26.9124,75.7873,'Ajmer Neighborhood Depot',26.4499,74.6399,135,950,3,'healthcare',current_date,current_date,520,'in_transit','van','picked_up',10.7,now() - interval '11 hours'),

  ('alia.shipper17@freightiq.demo','mohit.carrier13@freightiq.demo','Activity Batch Intermodal South 01','Chennai Electronics Yard',13.0827,80.2707,'Bengaluru Metro Crossdock',12.9716,77.5946,347,8600,25,'electronics',current_date,current_date + 2,1490,'in_transit','intermodal','in_transit',122.8,now() - interval '18 hours'),
  ('alia.shipper17@freightiq.demo','mohit.carrier13@freightiq.demo','Activity Batch Intermodal South 02','Hyderabad Commerce Park',17.3850,78.4867,'Pune Distribution Campus',18.5204,73.8567,560,9300,28,'consumer_goods',current_date + 1,current_date + 3,1710,'matched','intermodal','matched',213.0,now() - interval '9 hours'),
  ('alia.shipper17@freightiq.demo','ishita.carrier14@freightiq.demo','Activity Batch Express Air 01','Delhi Health Airside',28.5562,77.1000,'Lucknow Clinical Exchange',26.8467,80.9462,555,1500,5,'pharma',current_date,current_date,2480,'in_transit','express_air','in_transit',599.4,now() - interval '10 hours'),
  ('alia.shipper17@freightiq.demo','ishita.carrier14@freightiq.demo','Activity Batch Express Air 02','Delhi Rapid Cargo Terminal',28.5562,77.1000,'Mumbai Diagnostics Gate',19.0896,72.8656,1148,1250,4,'diagnostics',current_date,current_date,3380,'matched','express_air','matched',1036.1,now() - interval '5 hours'),

  ('om.shipper18@freightiq.demo','pranav.carrier11@freightiq.demo','Activity Batch EV electronics 01','Pune Device Assembly',18.5204,73.8567,'Navi Mumbai Tech Transfer',19.0330,73.0297,165,5100,17,'electronics',current_date + 1,current_date + 2,1080,'matched','ev_truck','matched',32.8,now() - interval '6 hours'),
  ('om.shipper18@freightiq.demo','mohit.carrier13@freightiq.demo','Activity Batch Intermodal home goods 01','Hyderabad Home Goods Zone',17.3850,78.4867,'Pune Regional DC',18.5204,73.8567,560,9800,30,'home_goods',current_date,current_date + 3,1680,'in_transit','intermodal','picked_up',223.9,now() - interval '13 hours'),
  ('om.shipper18@freightiq.demo','mohit.carrier13@freightiq.demo','Activity Batch Intermodal home goods 02','Chennai Furnishing Yard',13.0827,80.2707,'Bengaluru Lifestyle Depot',12.9716,77.5946,347,7900,24,'home_goods',current_date + 1,current_date + 2,1320,'matched','intermodal','matched',110.2,now() - interval '7 hours'),
  ('om.shipper18@freightiq.demo','kavya.carrier12@freightiq.demo','Activity Batch Van urban retail 01','Mumbai Retail Node',19.0760,72.8777,'Pune City Minihub',18.5204,73.8567,150,1200,5,'retail',current_date,current_date + 1,610,'in_transit','van','in_transit',14.8,now() - interval '9 hours'),

  ('rhea.shipper19@freightiq.demo','ishita.carrier14@freightiq.demo','Activity Batch Express medical 01','Delhi BioSafe Terminal',28.5562,77.1000,'Chandigarh Care Hub',30.7333,76.7794,260,1100,3,'healthcare',current_date,current_date,1820,'in_transit','express_air','in_transit',205.9,now() - interval '6 hours'),
  ('rhea.shipper19@freightiq.demo','kavya.carrier12@freightiq.demo','Activity Batch Van healthcare 01','Jaipur Med Supply Point',26.9124,75.7873,'Ajmer Clinic Grid',26.4499,74.6399,135,990,3,'healthcare',current_date + 1,current_date + 1,560,'matched','van','matched',10.8,now() - interval '4 hours'),
  ('rhea.shipper19@freightiq.demo','pranav.carrier11@freightiq.demo','Activity Batch EV cold lane 01','Ahmedabad Cool Storage',23.0225,72.5714,'Mumbai Retail Foods',19.0760,72.8777,530,5800,16,'perishables',current_date,current_date + 1,1250,'in_transit','ev_truck','in_transit',116.7,now() - interval '16 hours'),
  ('rhea.shipper19@freightiq.demo','mohit.carrier13@freightiq.demo','Activity Batch Intermodal clinic stock 01','Hyderabad Medical Park',17.3850,78.4867,'Pune Hospital Stores',18.5204,73.8567,560,4200,12,'pharma',current_date + 1,current_date + 2,1440,'matched','intermodal','matched',96.4,now() - interval '5 hours');

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
  shipper.id,
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
from tmp_activity_specs spec
join public.profiles shipper on shipper.email = spec.shipper_email
where not exists (
  select 1
  from public.loads existing
  where existing.title = spec.title
);

create temp table tmp_activity_load_rows on commit drop as
select
  load.id as load_id,
  load.shipper_id,
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
from tmp_activity_specs spec
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
  round((load.budget_usd * 0.9)::numeric, 1)::float8,
  round((load.budget_usd * 0.85)::numeric, 1)::float8,
  round((load.budget_usd * 1.55)::numeric, 1)::float8,
  round((0.8 + (load.distance_km / 420.0))::numeric, 1)::float8,
  round((1.6 + (load.distance_km / 340.0))::numeric, 1)::float8,
  round((2.7 + (load.distance_km / 250.0))::numeric, 1)::float8,
  round((0.3 + (load.distance_km / 900.0))::numeric, 1)::float8,
  load.created_at + interval '6 minutes'
from tmp_activity_load_rows load
where not exists (
  select 1 from public.modal_comparisons modal where modal.load_id = load.load_id
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
        'label', 'Shipment picked up and dispatched',
        'timestamp', to_char(load.created_at + interval '8 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.origin_address
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
        'label', 'Shipment crossed active route checkpoint',
        'timestamp', to_char(load.created_at + interval '13 hours', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'location', load.destination_address
      )
    )
  end,
  case load.shipment_status
    when 'matched' then load.created_at + interval '28 hours'
    when 'picked_up' then load.created_at + interval '20 hours'
    else load.created_at + interval '18 hours'
  end,
  null,
  load.created_at + interval '2 hours'
from tmp_activity_load_rows load
join public.profiles carrier_profile on carrier_profile.email = load.carrier_email
join public.carriers carrier on carrier.owner_id = carrier_profile.id
where not exists (
  select 1 from public.shipments shipment
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
  case
    when shipment.status = 'in_transit' then round((shipment.co2_kg * 0.07)::numeric, 1)::float8
    when shipment.status = 'picked_up' then round((shipment.co2_kg * 0.03)::numeric, 1)::float8
    else 0::float8
  end,
  shipment.created_at + interval '15 minutes'
from public.shipments shipment
join tmp_activity_load_rows load on load.load_id = shipment.load_id
where not exists (
  select 1 from public.co2_records record where record.shipment_id = shipment.id
);

commit;
