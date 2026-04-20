-- Ako tabele već postoje ali fale kolone (stara verzija šeme), pokreni ovo.
-- Bezbedno je više puta (IF NOT EXISTS).

alter table public.users add column if not exists telegram_chat_id text;
alter table public.users add column if not exists plan text not null default 'free';
alter table public.users add column if not exists created_at timestamptz not null default now();
-- plan check: ako već postoji drugačiji check, ignoriši grešku ručno
do $$
begin
  alter table public.users add constraint users_plan_check check (plan in ('free', 'pro'));
exception
  when duplicate_object then null;
end $$;

alter table public.alerts add column if not exists min_price numeric;
alter table public.alerts add column if not exists last_scraped_at timestamptz;
alter table public.alerts add column if not exists is_active boolean not null default true;
alter table public.alerts alter column location set default '';

notify pgrst, 'reload schema';
