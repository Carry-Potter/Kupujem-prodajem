-- Pokreni u Supabase → SQL Editor (jedan put) na postojećoj bazi.
-- Dodaje: alerts.cheapest_limit (10 / 20 / 50), ads.image_url

alter table public.ads
  add column if not exists image_url text;

alter table public.alerts
  add column if not exists cheapest_limit smallint not null default 20;

update public.alerts set cheapest_limit = 20 where cheapest_limit is null;

alter table public.alerts
  drop constraint if exists alerts_cheapest_limit_check;

alter table public.alerts
  add constraint alerts_cheapest_limit_check
  check (cheapest_limit in (10, 20, 50));

notify pgrst, 'reload schema';
