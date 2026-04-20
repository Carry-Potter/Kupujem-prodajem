-- Jednokratni link token za povezivanje Telegram naloga (MVP).
alter table public.users
  add column if not exists telegram_connect_token text;

comment on column public.users.telegram_connect_token is
  'Jednokratni UUID za deep link t.me/bot?start=...; briše se posle uspešnog /start';

create index if not exists users_telegram_connect_token_idx
  on public.users (telegram_connect_token)
  where telegram_connect_token is not null;

notify pgrst, 'reload schema';
