# Telegram bot (povezivanje + notifikacije)

## Šta radi

- Ovaj proces (`telegramBot.ts`) sluša **polling** i obrađuje `/start <TOKEN>` kada korisnik otvori link iz aplikacije.
- **Slanje** notifikacija za nove oglase radi Next.js worker / server preko `node-telegram-bot-api` **bez** pollinga (isti `TELEGRAM_BOT_TOKEN`).

## Lokalno pokretanje

1. U Supabase SQL Editoru pokreni migraciju `supabase/migrations/004_telegram_connect_token.sql` (ili ceo ažuriran `schema.sql` za novi projekat).

2. U `.env.local` (ili okruženju koje učitava `dotenv`):

   - `TELEGRAM_BOT_TOKEN` — od @BotFather
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — korisničko ime bota **bez** `@` (za deep link)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (ili `SUPABASE_SECRET_KEY`)

3. U drugom terminalu:

   ```bash
   npm run telegram-bot
   ```

4. U aplikaciji: **Podešavanja → Poveži Telegram** → otvori link u Telegramu → **Start**.

Worker (`npm run worker`) i Next server koriste isti token za slanje poruka; **samo jedan** proces sme imati `polling: true` (ovaj bot skript). Ne pokreći dva bota sa istim tokenom.
