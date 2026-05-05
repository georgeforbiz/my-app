-- Ensure signed client drawings can be persisted per agreement row.
alter table public.agreements add column if not exists client_signature text;

notify pgrst, 'reload schema';
