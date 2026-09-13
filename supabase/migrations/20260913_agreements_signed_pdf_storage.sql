-- Persist archived signed agreement PDFs and their public Storage URLs.

alter table public.agreements
  add column if not exists pdf_url text;

comment on column public.agreements.pdf_url is
  'Public Supabase Storage URL for the archived signed agreement PDF.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signed-agreements',
  'signed-agreements',
  true,
  20971520,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone with the URL can read archived PDFs (bucket is public for stable getPublicUrl links).
drop policy if exists "Signed agreements public read" on storage.objects;
create policy "Signed agreements public read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'signed-agreements');

-- Uploads are performed with the service role (bypasses RLS). Keep authenticated
-- provider writes as a fallback for same-folder paths: {provider_id}/{agreement_id}.pdf
drop policy if exists "Signed agreements provider insert" on storage.objects;
create policy "Signed agreements provider insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'signed-agreements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Signed agreements provider update" on storage.objects;
create policy "Signed agreements provider update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'signed-agreements'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'signed-agreements'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
