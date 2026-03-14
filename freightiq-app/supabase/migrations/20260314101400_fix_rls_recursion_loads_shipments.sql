-- Fix RLS recursion between loads and shipments policies
-- UP
begin;

create or replace function public.user_owns_load(
  target_load_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.loads
    where id = target_load_id
      and shipper_id = check_user_id
  );
$$;

create or replace function public.user_owns_carrier(
  target_carrier_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.carriers
    where id = target_carrier_id
      and owner_id = check_user_id
  );
$$;

create or replace function public.load_is_open(target_load_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.loads
    where id = target_load_id
      and status = 'open'
  );
$$;

create or replace function public.user_can_view_assigned_load(
  target_load_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shipments
    join public.carriers on carriers.id = shipments.carrier_id
    where shipments.load_id = target_load_id
      and shipments.status <> 'cancelled'
      and carriers.owner_id = check_user_id
  );
$$;

drop policy if exists "Shippers can view their shipments" on public.shipments;
drop policy if exists "Carriers can view their shipments" on public.shipments;
drop policy if exists "Carriers can update their shipments" on public.shipments;
drop policy if exists "Carriers can create shipments for open loads" on public.shipments;
drop policy if exists "Carriers can view assigned loads" on public.loads;

create policy "Shippers can view their shipments"
on public.shipments
for select
using (public.user_owns_load(shipments.load_id) or public.is_admin());

create policy "Carriers can view their shipments"
on public.shipments
for select
using (public.user_owns_carrier(shipments.carrier_id) or public.is_admin());

create policy "Carriers can update their shipments"
on public.shipments
for update
using (public.user_owns_carrier(shipments.carrier_id) or public.is_admin())
with check (public.user_owns_carrier(shipments.carrier_id) or public.is_admin());

create policy "Carriers can create shipments for open loads"
on public.shipments
for insert
with check (
  (public.user_owns_carrier(shipments.carrier_id) and public.load_is_open(shipments.load_id))
  or public.is_admin()
);

create policy "Carriers can view assigned loads"
on public.loads
for select
using (public.user_can_view_assigned_load(loads.id) or public.is_admin());

commit;

-- DOWN
-- Re-run prior migrations:
--   20260314100300_carriers_shipments_co2.sql
--   20260314100400_mvp_schema_hardening.sql
--   20260314100900_allow_carriers_view_assigned_loads.sql
