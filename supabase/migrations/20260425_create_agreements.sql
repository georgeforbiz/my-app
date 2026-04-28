create extension if not exists pgcrypto;

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  project_title text not null,
  total_price numeric not null check (total_price > 0),
  payment_type text not null default 'single' check (payment_type in ('single', 'milestones')),
  milestones jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'signed', 'completed')),
  client_signature text,
  created_at timestamptz not null default now()
);

create index if not exists agreements_provider_id_idx on public.agreements(provider_id);
create index if not exists agreements_status_idx on public.agreements(status);

alter table public.agreements add column if not exists project_title text;
alter table public.agreements add column if not exists payment_type text not null default 'single';
alter table public.agreements add column if not exists milestones jsonb not null default '[]'::jsonb;

alter table public.agreements drop column if exists provider_name;
alter table public.agreements drop column if exists service_description;
alter table public.agreements drop column if exists payment_terms;

update public.agreements
set payment_type = 'single'
where payment_type is null or payment_type not in ('single', 'milestones');

alter table public.agreements
  drop constraint if exists agreements_payment_type_check,
  add constraint agreements_payment_type_check check (payment_type in ('single', 'milestones'));

alter table public.agreements
  drop constraint if exists agreements_status_check,
  add constraint agreements_status_check check (status in ('pending', 'signed', 'completed'));
