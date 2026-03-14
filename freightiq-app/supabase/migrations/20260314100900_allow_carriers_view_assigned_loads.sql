begin;

drop policy if exists "Carriers can view assigned loads" on public.loads;

create policy "Carriers can view assigned loads"
on public.loads
for select
using (
  exists (
    select 1
    from public.shipments
    join public.carriers on carriers.id = shipments.carrier_id
    where shipments.load_id = loads.id
      and shipments.status <> 'cancelled'
      and carriers.owner_id = auth.uid()
  )
);

commit;
