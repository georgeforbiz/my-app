-- Public share links must be readable without a session, and logos must load on those pages.

-- Agreements: restore anonymous SELECT for client share links (write stays provider-scoped).
drop policy if exists agreements_public_read on public.agreements;
create policy agreements_public_read
  on public.agreements
  for select
  to anon, authenticated
  using (true);

-- Logos: allow anyone to read objects in the logos bucket (bucket is public).
drop policy if exists "Logos public read" on storage.objects;
create policy "Logos public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'logos');

-- Keep bucket marked public for stable getPublicUrl links.
update storage.buckets
set public = true
where id = 'logos';

notify pgrst, 'reload schema';
