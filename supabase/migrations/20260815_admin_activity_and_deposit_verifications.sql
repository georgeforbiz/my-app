-- Admin activity feed + pending deposit verification (server-side).

create extension if not exists pgcrypto;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_type text not null check (actor_type in ('user', 'admin', 'system')),
  actor_id text,
  action text not null,
  agreement_id uuid references public.agreements(id) on delete set null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);
create index if not exists activity_events_action_idx on public.activity_events (action);
create index if not exists activity_events_agreement_id_idx on public.activity_events (agreement_id);

alter table public.activity_events enable row level security;

-- No public policies: only service-role / backend writes and admin APIs read.

create table if not exists public.deposit_verifications (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.agreements(id) on delete cascade,
  milestone_index integer not null,
  status text not null default 'submitted' check (status in ('submitted', 'confirmed')),
  submitted_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by text
);

-- At most one open (submitted) verification per agreement + milestone.
create unique index if not exists deposit_verifications_open_idx
  on public.deposit_verifications (agreement_id, milestone_index)
  where status = 'submitted';

create index if not exists deposit_verifications_status_idx
  on public.deposit_verifications (status);

alter table public.deposit_verifications enable row level security;

notify pgrst, 'reload schema';
