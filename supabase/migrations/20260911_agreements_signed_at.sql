-- Persist when the client signed the agreement (for display under the signature).
alter table public.agreements
  add column if not exists signed_at timestamptz;
