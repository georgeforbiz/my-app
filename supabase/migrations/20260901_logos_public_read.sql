-- Allow anonymous reads of logos so client agreement links can render provider logos.
drop policy if exists "Logos public read" on storage.objects;
create policy "Logos public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'logos');

notify pgrst, 'reload schema';
