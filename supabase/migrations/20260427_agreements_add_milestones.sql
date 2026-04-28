-- Fix: "Could not find the 'milestones' column of 'agreements' in the schema cache"
-- Run this entire script in Supabase → SQL → New query → Run

-- 1) Ensure column exists (safe if already present)
alter table public.agreements add column if not exists milestones jsonb;

-- 2) Backfill nulls (older rows)
update public.agreements
set milestones = '[]'::jsonb
where milestones is null;

-- 3) Default + NOT NULL (matches app: always jsonb array)
alter table public.agreements
  alter column milestones set default '[]'::jsonb;

alter table public.agreements
  alter column milestones set not null;

-- 4) Reload PostgREST schema cache (required after DDL)
notify pgrst, 'reload schema';
