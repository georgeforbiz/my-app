-- Fix older public.agreements tables missing project_title / payment_type / milestones.
-- Run in Supabase SQL Editor if you see: "column agreements.project_title does not exist"

alter table public.agreements add column if not exists project_title text;
alter table public.agreements add column if not exists payment_type text;
alter table public.agreements add column if not exists milestones jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agreements'
      and column_name = 'service_description'
  ) then
    update public.agreements
    set project_title = coalesce(
      nullif(trim(project_title), ''),
      nullif(trim(service_description), ''),
      'Untitled project'
    )
    where project_title is null or trim(coalesce(project_title, '')) = '';
  else
    update public.agreements
    set project_title = coalesce(nullif(trim(project_title), ''), 'Untitled project')
    where project_title is null or trim(coalesce(project_title, '')) = '';
  end if;
end $$;

alter table public.agreements drop column if exists provider_name;
alter table public.agreements drop column if exists service_description;
alter table public.agreements drop column if exists payment_terms;

update public.agreements
set payment_type = 'single'
where payment_type is null or payment_type not in ('single', 'milestones');

update public.agreements
set milestones = '[]'::jsonb
where milestones is null;

alter table public.agreements
  alter column payment_type set default 'single';

alter table public.agreements
  alter column milestones set default '[]'::jsonb;

alter table public.agreements alter column project_title set not null;
alter table public.agreements alter column payment_type set not null;
alter table public.agreements alter column milestones set not null;

alter table public.agreements
  drop constraint if exists agreements_payment_type_check,
  add constraint agreements_payment_type_check check (payment_type in ('single', 'milestones'));

alter table public.agreements
  drop constraint if exists agreements_status_check,
  add constraint agreements_status_check check (status in ('pending', 'signed', 'completed'));

notify pgrst, 'reload schema';
