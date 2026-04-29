-- Persist provider identity fields as separate profile columns.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  business_name text not null default '',
  phone_number text,
  service_category text,
  service_area text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_business_name_idx on public.profiles (business_name);
create index if not exists profiles_full_name_idx on public.profiles (full_name);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    business_name,
    phone_number,
    service_category,
    service_area,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', ''),
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'service_category',
    new.raw_user_meta_data ->> 'service_area',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    business_name = excluded.business_name,
    phone_number = excluded.phone_number,
    service_category = excluded.service_category,
    service_area = excluded.service_area,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_or_updated_profile on auth.users;
create trigger on_auth_user_created_or_updated_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute procedure public.handle_profile_from_auth_user();

-- Backfill existing users.
insert into public.profiles (
  id,
  email,
  full_name,
  business_name,
  phone_number,
  service_category,
  service_area,
  updated_at
)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'business_name', ''),
  u.raw_user_meta_data ->> 'phone_number',
  u.raw_user_meta_data ->> 'service_category',
  u.raw_user_meta_data ->> 'service_area',
  now()
from auth.users u
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  business_name = excluded.business_name,
  phone_number = excluded.phone_number,
  service_category = excluded.service_category,
  service_area = excluded.service_area,
  updated_at = now();

notify pgrst, 'reload schema';
