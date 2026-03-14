begin;

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
  coalesce(l.budget_usd, 0),
  round((coalesce(l.budget_usd, 0) * 0.93)::numeric, 1)::float8,
  round((coalesce(l.budget_usd, 0) * 0.88)::numeric, 1)::float8,
  round((coalesce(l.budget_usd, 0) * 1.74)::numeric, 1)::float8,
  2.4::float8,
  3.2::float8,
  5.1::float8,
  0.8::float8,
  coalesce(l.created_at + interval '5 minutes', now())
from public.loads l
where not exists (
  select 1
  from public.modal_comparisons modal
  where modal.load_id = l.id
);

commit;
