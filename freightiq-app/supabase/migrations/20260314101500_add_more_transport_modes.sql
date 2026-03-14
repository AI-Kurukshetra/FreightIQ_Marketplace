begin;

alter table public.shipments
  drop constraint if exists shipments_transport_mode_check;

alter table public.shipments
  add constraint shipments_transport_mode_check
  check (
    transport_mode in (
      'truck',
      'ev_truck',
      'van',
      'flatbed',
      'reefer',
      'drayage',
      'rail',
      'intermodal',
      'sea',
      'air',
      'express_air'
    )
  );

alter table public.co2_records
  drop constraint if exists co2_records_transport_mode_check;

alter table public.co2_records
  add constraint co2_records_transport_mode_check
  check (
    transport_mode in (
      'truck',
      'ev_truck',
      'van',
      'flatbed',
      'reefer',
      'drayage',
      'rail',
      'intermodal',
      'sea',
      'air',
      'express_air'
    )
  );

alter table public.carriers
  drop constraint if exists carriers_service_modes_check;

alter table public.carriers
  add constraint carriers_service_modes_check
  check (
    cardinality(service_modes) > 0
    and service_modes <@ array[
      'truck',
      'ev_truck',
      'van',
      'flatbed',
      'reefer',
      'drayage',
      'rail',
      'intermodal',
      'sea',
      'air',
      'express_air'
    ]::text[]
  );

alter table public.loads
  drop constraint if exists loads_preferred_mode_check;

alter table public.loads
  add constraint loads_preferred_mode_check
  check (
    preferred_mode in (
      'truck',
      'ev_truck',
      'van',
      'flatbed',
      'reefer',
      'drayage',
      'rail',
      'intermodal',
      'sea',
      'air',
      'express_air'
    )
  );

commit;
