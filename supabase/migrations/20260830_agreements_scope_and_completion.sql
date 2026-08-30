-- Scope, exclusions, and completion date for agreement clarity
alter table public.agreements add column if not exists scope_of_work text;
alter table public.agreements add column if not exists scope_exclusions text;
alter table public.agreements add column if not exists estimated_completion_date date;
