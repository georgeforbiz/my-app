-- Temporary policy to allow public client-link signing/deposit/release flows.
-- Use for testing/demo environments. Tighten policies for production.

alter table public.agreements enable row level security;

drop policy if exists agreements_public_read on public.agreements;
create policy agreements_public_read
on public.agreements
for select
using (true);

drop policy if exists agreements_public_update on public.agreements;
create policy agreements_public_update
on public.agreements
for update
using (true)
with check (true);

notify pgrst, 'reload schema';
