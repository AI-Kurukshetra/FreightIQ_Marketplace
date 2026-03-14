alter table public.profiles
add column if not exists email text;

create unique index if not exists profiles_email_unique_idx
on public.profiles (email)
where email is not null;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is distinct from u.email);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'shipper')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    company_name = excluded.company_name,
    role = excluded.role;

  return new;
end;
$$;
