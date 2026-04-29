-- Provider display fields (aligned with registration metadata keys).
alter table public.agreements add column if not exists full_name text;
alter table public.agreements add column if not exists business_name text;

notify pgrst, 'reload schema';
