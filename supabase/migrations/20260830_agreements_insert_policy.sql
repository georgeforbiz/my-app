-- Allow authenticated providers to insert their own agreements (client-side fallback).
alter table public.agreements enable row level security;

drop policy if exists agreements_authenticated_insert on public.agreements;
create policy agreements_authenticated_insert
on public.agreements
for insert
to authenticated
with check (auth.uid() = provider_id);

notify pgrst, 'reload schema';
