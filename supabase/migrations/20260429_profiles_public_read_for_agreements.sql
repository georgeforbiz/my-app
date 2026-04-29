-- Allow public agreement pages to read provider identity display fields.
-- This is required because agreement links are commonly opened by unauthenticated users.

drop policy if exists "Public can read profiles for agreements" on public.profiles;
create policy "Public can read profiles for agreements"
  on public.profiles
  for select
  using (true);

notify pgrst, 'reload schema';
