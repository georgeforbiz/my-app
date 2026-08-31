alter table public.agreements
  add column if not exists vat_mode text not null default 'included';

comment on column public.agreements.vat_mode is 'included = price includes 20% VAT; exempt = VAT exempt';
