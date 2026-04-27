/**
 * Standalone Telegram bot (polling) za povezivanje naloga: /start <TOKEN>
 *
 * Pokretanje: npm run telegram-bot
 * Zahteva: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import { createAdminClient } from "@/lib/supabase/admin";

// Local dev: prvo .env.local (Next stil), zatim fallback na .env.
dotenv.config({ path: ".env.local" });
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("[telegram-bot] TELEGRAM_BOT_TOKEN nedostaje.");
  process.exit(1);
}

const admin = createAdminClient();
const bot = new TelegramBot(token, { polling: true });

bot.onText(/^\/start(?:\s+(\S+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const connectToken = match?.[1]?.trim();

  if (!connectToken) {
    await bot.sendMessage(
      chatId,
      `Zdravo! Otvori link iz aplikacije (Poveži Telegram) da dobiješ /start sa kodom.\n\nAko želiš ručno povezivanje, tvoj chat ID je: ${chatId}`
    );
    return;
  }

  const { data: row, error: findErr } = await admin
    .from("users")
    .select("id")
    .eq("telegram_connect_token", connectToken)
    .maybeSingle();

  if (findErr) {
    console.error("[telegram-bot] lookup:", findErr.message);
    await bot.sendMessage(
      chatId,
      "Greška pri povezivanju. Pokušaj ponovo iz aplikacije."
    );
    return;
  }

  if (!row?.id) {
    await bot.sendMessage(
      chatId,
      "Link je nevažeći ili je već iskorišćen. Generiši novi u podešavanjima aplikacije."
    );
    return;
  }

  const userId = row.id as string;
  const chatIdStr = String(chatId);

  try {
    // Jedan Telegram chat = jedan app nalog (poslednji link pobedi).
    await admin
      .from("users")
      .update({ telegram_chat_id: null })
      .eq("telegram_chat_id", chatIdStr)
      .neq("id", userId);

    const { error: updErr } = await admin
      .from("users")
      .update({
        telegram_chat_id: chatIdStr,
        telegram_connect_token: null,
      })
      .eq("id", userId);

    if (updErr) {
      console.error("[telegram-bot] update:", updErr.message);
      await bot.sendMessage(
        chatId,
        "Nije uspelo čuvanje. Pokušaj ponovo ili kontaktiraj podršku."
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      "✅ Nalog je povezan. Dobićeš obaveštenja kada pronađemo novi oglas koji odgovara tvom upozorenju."
    );
  } catch (e) {
    console.error("[telegram-bot]", e);
    await bot.sendMessage(chatId, "Neočekivana greška. Pokušaj ponovo.");
  }
});

bot.onText(/^\/(?!start\b)(\w+)/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "Nepoznata komanda. Za povezivanje koristi link iz aplikacije (Podešavanja → Poveži Telegram)."
  );
});

bot.onText(/^\/chatid$/, async (msg) => {
  await bot.sendMessage(msg.chat.id, `Tvoj chat ID je: ${msg.chat.id}`);
});

bot.on("polling_error", (err) => {
  console.error("[telegram-bot] polling_error:", err.message);
});

console.log(
  "[telegram-bot] Polling aktivan. Čekam /start … (Ctrl+C za izlaz)"
);
