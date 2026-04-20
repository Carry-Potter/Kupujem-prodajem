-- Stanje predmeta (KP) + pretraga u tekstu oglasa
alter table public.alerts
  add column if not exists kp_condition text;

alter table public.alerts
  add column if not exists search_in_description boolean not null default false;

comment on column public.alerts.kp_condition is
  'KP filter: new | as-new | used | damaged; NULL = bilo koje stanje';

comment on column public.alerts.search_in_description is
  'Kada je true, KP URL dobija descriptionSearch=1 i uparivanje gleda i snippet opisa';

alter table public.alerts
  drop constraint if exists alerts_kp_condition_check;

alter table public.alerts
  add constraint alerts_kp_condition_check
  check (
    kp_condition is null
    or kp_condition in ('new', 'as-new', 'used', 'damaged')
  );

-- Snippet opisa za uparivanje kad je uključena pretraga po tekstu oglasa
alter table public.ads
  add column if not exists description_snippet text;

notify pgrst, 'reload schema';
