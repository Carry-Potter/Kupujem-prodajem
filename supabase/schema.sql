-- =============================================================================
-- notifyKP – kompletna šema (public.users, alerts, ads, matches)
-- =============================================================================
-- Gde pokrenuti: Supabase Dashboard → SQL Editor → New query → Run (ceo fajl)
--
-- Posle uspeha u Table Editoru: šema "public" (ne "auth") – tabele:
--   users, alerts, ads, matches
--
-- Ako trigger prijavi grešku na "execute procedure", probaj zameniti red sa:
--   for each row execute function public.handle_new_user();
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. public.users
--    Kolone: id (= auth.users.id), email, plan, telegram_chat_id, telegram_connect_token, created_at
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  plan text not null default 'free',
  telegram_chat_id text,
  telegram_connect_token text,
  created_at timestamptz not null default now(),
  constraint users_plan_check check (plan in ('free', 'pro'))
);

comment on table public.users is 'notifyKP: profil korisnika (1:1 sa auth.users)';

-- -----------------------------------------------------------------------------
-- 2. public.alerts
-- -----------------------------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  keyword text not null,
  max_price numeric not null,
  min_price numeric,
  location text not null default '',
  is_active boolean not null default true,
  last_scraped_at timestamptz,
  cheapest_limit smallint not null default 20,
  kp_condition text,
  search_in_description boolean not null default false,
  created_at timestamptz not null default now(),
  constraint alerts_cheapest_limit_check check (cheapest_limit in (10, 20, 50)),
  constraint alerts_kp_condition_check check (
    kp_condition is null
    or kp_condition in ('new', 'as-new', 'used', 'damaged')
  )
);

create index if not exists alerts_user_id_idx on public.alerts (user_id);
create index if not exists alerts_active_idx on public.alerts (is_active) where is_active = true;

comment on table public.alerts is 'notifyKP: upozorenja korisnika';

-- -----------------------------------------------------------------------------
-- 3. public.ads (spoljni id oglasa)
-- -----------------------------------------------------------------------------
create table if not exists public.ads (
  id text primary key,
  title text not null,
  price numeric,
  location text,
  url text not null,
  image_url text,
  description_snippet text,
  created_at timestamptz not null default now()
);

comment on table public.ads is 'notifyKP: oglasi sa portala (worker upisuje)';

-- -----------------------------------------------------------------------------
-- 4. public.matches
-- -----------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  ad_id text not null references public.ads (id) on delete cascade,
  sent boolean not null default false,
  archived_to_history boolean not null default false,
  created_at timestamptz not null default now(),
  unique (alert_id, ad_id)
);

create index if not exists matches_alert_sent_idx on public.matches (alert_id, sent);

comment on table public.matches is 'notifyKP: par alert + oglas, sent = Telegram poslat';

-- -----------------------------------------------------------------------------
-- 5. Backfill + trigger za nove naloge
-- -----------------------------------------------------------------------------
insert into public.users (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do update set email = excluded.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. RLS
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.alerts enable row level security;
alter table public.ads enable row level security;
alter table public.matches enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

drop policy if exists "alerts_select_own" on public.alerts;
drop policy if exists "alerts_insert_own" on public.alerts;
drop policy if exists "alerts_update_own" on public.alerts;
drop policy if exists "alerts_delete_own" on public.alerts;
drop policy if exists "alerts_all_own" on public.alerts;
create policy "alerts_select_own" on public.alerts
  for select using (auth.uid() = user_id);
create policy "alerts_insert_own" on public.alerts
  for insert with check (auth.uid() = user_id);
create policy "alerts_update_own" on public.alerts
  for update using (auth.uid() = user_id);
create policy "alerts_delete_own" on public.alerts
  for delete using (auth.uid() = user_id);

drop policy if exists "ads_read_authenticated" on public.ads;
create policy "ads_read_authenticated" on public.ads
  for select to authenticated using (true);

drop policy if exists "matches_read_own_alerts" on public.matches;
create policy "matches_read_own_alerts" on public.matches
  for select using (
    exists (
      select 1 from public.alerts a
      where a.id = matches.alert_id and a.user_id = auth.uid()
    )
  );

drop policy if exists "matches_update_own" on public.matches;
create policy "matches_update_own" on public.matches
  for update using (
    exists (
      select 1 from public.alerts a
      where a.id = matches.alert_id and a.user_id = auth.uid()
    )
  );

-- Osveži PostgREST keš (da API odmah vidi tabele)
notify pgrst, 'reload schema';
