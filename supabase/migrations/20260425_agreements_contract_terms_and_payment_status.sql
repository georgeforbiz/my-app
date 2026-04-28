-- Agreement flow upgrade:
-- - custom_terms column for provider-authored terms
-- - payment_status column for escrow release flow
-- - provider_name + service_area for document rendering

alter table public.agreements add column if not exists custom_terms text;
alter table public.agreements add column if not exists payment_status text not null default 'pending';
alter table public.agreements add column if not exists provider_name text;
alter table public.agreements add column if not exists service_area text;

update public.agreements
set payment_status = 'pending'
where payment_status is null or payment_status not in ('pending', 'released');

alter table public.agreements
  drop constraint if exists agreements_payment_status_check,
  add constraint agreements_payment_status_check check (payment_status in ('pending', 'released'));

notify pgrst, 'reload schema';
