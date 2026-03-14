create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and role = 'admin'
  );
$$;

create or replace function public.sync_load_status_from_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_load_status text;
begin
  next_load_status := case new.status
    when 'matched' then 'matched'
    when 'picked_up' then 'in_transit'
    when 'in_transit' then 'in_transit'
    when 'delivered' then 'delivered'
    when 'cancelled' then 'open'
    else 'open'
  end;

  update public.loads
  set status = next_load_status
  where id = new.load_id;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carriers_service_modes_check'
      and conrelid = 'public.carriers'::regclass
  ) then
    alter table public.carriers
      add constraint carriers_service_modes_check
      check (
        cardinality(service_modes) > 0
        and service_modes <@ array['truck', 'rail', 'sea', 'air']::text[]
      ) not valid;

    alter table public.carriers
      validate constraint carriers_service_modes_check;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carriers_coverage_corridors_array_check'
      and conrelid = 'public.carriers'::regclass
  ) then
    alter table public.carriers
      add constraint carriers_coverage_corridors_array_check
      check (jsonb_typeof(coverage_corridors) = 'array') not valid;

    alter table public.carriers
      validate constraint carriers_coverage_corridors_array_check;
  end if;
end
$$;

create unique index if not exists carriers_owner_id_unique_idx
on public.carriers (owner_id);

update public.shipments
set status = 'matched'
where status = 'confirmed';

alter table public.shipments
  drop constraint if exists shipments_status_check;

alter table public.shipments
  add constraint shipments_status_check
  check (status in ('matched', 'picked_up', 'in_transit', 'delivered', 'cancelled'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'shipments_tracking_updates_array_check'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_tracking_updates_array_check
      check (jsonb_typeof(tracking_updates) = 'array') not valid;

    alter table public.shipments
      validate constraint shipments_tracking_updates_array_check;
  end if;
end
$$;

create unique index if not exists shipments_one_active_shipment_per_load_idx
on public.shipments (load_id)
where status <> 'cancelled';

drop trigger if exists sync_load_status_from_shipment_trigger on public.shipments;

create trigger sync_load_status_from_shipment_trigger
after insert or update of status on public.shipments
for each row
execute function public.sync_load_status_from_shipment();

drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can manage all loads" on public.loads;
drop policy if exists "Admins can manage all carriers" on public.carriers;
drop policy if exists "Admins can manage all shipments" on public.shipments;
drop policy if exists "Admins can manage all CO2 records" on public.co2_records;
drop policy if exists "Admins can manage all modal comparisons" on public.modal_comparisons;
drop policy if exists "Carriers can create shipments for open loads" on public.shipments;
drop policy if exists "Carriers can update their shipments" on public.shipments;
drop policy if exists "Shippers can create modal comparisons for own loads" on public.modal_comparisons;
drop policy if exists "Shippers can create CO2 records for own shipments" on public.co2_records;

create policy "Admins can view all profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage all loads"
on public.loads
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage all carriers"
on public.carriers
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage all shipments"
on public.shipments
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage all CO2 records"
on public.co2_records
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage all modal comparisons"
on public.modal_comparisons
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Carriers can create shipments for open loads"
on public.shipments
for insert
with check (
  exists (
    select 1
    from public.carriers
    where carriers.id = shipments.carrier_id
      and carriers.owner_id = auth.uid()
  )
  and exists (
    select 1
    from public.loads
    where loads.id = shipments.load_id
      and loads.status = 'open'
  )
);

create policy "Carriers can update their shipments"
on public.shipments
for update
using (
  exists (
    select 1
    from public.carriers
    where carriers.id = shipments.carrier_id
      and carriers.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carriers
    where carriers.id = shipments.carrier_id
      and carriers.owner_id = auth.uid()
  )
);

create policy "Shippers can create CO2 records for own shipments"
on public.co2_records
for insert
with check (
  auth.uid() = shipper_id
  and exists (
    select 1
    from public.shipments
    join public.loads on loads.id = shipments.load_id
    where shipments.id = co2_records.shipment_id
      and loads.shipper_id = auth.uid()
  )
);

create policy "Shippers can create modal comparisons for own loads"
on public.modal_comparisons
for insert
with check (
  exists (
    select 1
    from public.loads
    where loads.id = modal_comparisons.load_id
      and loads.shipper_id = auth.uid()
  )
);
