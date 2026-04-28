-- Add escrow stage to payment_status lifecycle:
-- pending -> escrow_held -> released

update public.agreements
set payment_status = 'pending'
where payment_status is null or payment_status not in ('pending', 'escrow_held', 'released');

alter table public.agreements
  drop constraint if exists agreements_payment_status_check,
  add constraint agreements_payment_status_check check (payment_status in ('pending', 'escrow_held', 'released'));

notify pgrst, 'reload schema';
