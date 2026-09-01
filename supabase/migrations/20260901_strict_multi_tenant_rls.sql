-- Strict multi-tenant isolation: drop demo-wide policies and scope access to auth.uid().

-- ---------------------------------------------------------------------------
-- agreements (tenant key: provider_id = auth.uid())
-- ---------------------------------------------------------------------------
alter table public.agreements enable row level security;

drop policy if exists agreements_public_read on public.agreements;
drop policy if exists agreements_public_update on public.agreements;

drop policy if exists agreements_provider_select on public.agreements;
create policy agreements_provider_select
  on public.agreements
  for select
  to authenticated
  using (auth.uid() = provider_id);

drop policy if exists agreements_provider_update on public.agreements;
create policy agreements_provider_update
  on public.agreements
  for update
  to authenticated
  using (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

drop policy if exists agreements_provider_delete on public.agreements;
create policy agreements_provider_delete
  on public.agreements
  for delete
  to authenticated
  using (auth.uid() = provider_id);

-- agreements_authenticated_insert (provider_id = auth.uid()) remains from prior migration.

-- ---------------------------------------------------------------------------
-- profiles (tenant key: id = auth.uid())
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Public can read profiles for agreements" on public.profiles;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- "Users can view own profile" and "Users can update own profile" remain.

-- ---------------------------------------------------------------------------
-- activity_events / deposit_verifications: service-role only (no client policies)
-- Skip if admin tables were not created yet (20260815 migration).
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'activity_events'
  ) then
    execute 'alter table public.activity_events enable row level security';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'deposit_verifications'
  ) then
    execute 'alter table public.deposit_verifications enable row level security';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: logos bucket — writes scoped to logos/{auth.uid()}/*
-- Public bucket so agreement links can render logos via stable URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  4194304,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Logos insert own folder" on storage.objects;
create policy "Logos insert own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Logos update own folder" on storage.objects;
create policy "Logos update own folder"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Logos delete own folder" on storage.objects;
create policy "Logos delete own folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Logos select own folder" on storage.objects;
create policy "Logos select own folder"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
