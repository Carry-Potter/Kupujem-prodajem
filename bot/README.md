# Telegram webhook (povezivanje + notifikacije)

## Šta radi

- Next.js ruta `POST /api/telegram/webhook/<TELEGRAM_WEBHOOK_SECRET>` obrađuje `/start <TOKEN>` kada korisnik otvori link iz aplikacije.
- **Slanje** notifikacija za nove oglase radi Next.js worker / server preko `node-telegram-bot-api` (isti `TELEGRAM_BOT_TOKEN`).

## Lokalno pokretanje

1. U Supabase SQL Editoru pokreni migraciju `supabase/migrations/004_telegram_connect_token.sql` (ili ceo ažuriran `schema.sql` za novi projekat).

2. U `.env.local`:

   - `TELEGRAM_BOT_TOKEN` — od @BotFather
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — korisničko ime bota **bez** `@` (za deep link)
   - `NEXT_PUBLIC_APP_URL` (javni URL aplikacije)
   - `TELEGRAM_WEBHOOK_SECRET` (nasumična tajna vrednost)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (ili `SUPABASE_SECRET_KEY`)

3. U aplikaciji: **Podešavanja → Poveži Telegram**.
   - Route `/api/telegram/connect` automatski poziva Telegram `setWebhook`.
   - Posle otvaranja deep linka i `Start`, webhook upisuje `telegram_chat_id`.

4. Worker (`npm run worker`) i Next server koriste isti token za slanje poruka.
