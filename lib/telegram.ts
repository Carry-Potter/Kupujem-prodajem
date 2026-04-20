import TelegramBot from "node-telegram-bot-api";

/** Payload za obaveštenje o novom oglasu (tekst već formatiran za prikaz). */
export type TelegramListingPayload = {
  title: string;
  price: string;
  location: string;
  url: string;
  /** Apsolutni http(s) URL slike; ako Telegram ne može da učita sliku, šalje se samo tekst. */
  image_url?: string | null;
};

const TELEGRAM_PHOTO_CAPTION_MAX = 1024;

function truncatePlain(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

function isPublicHttpImageUrl(u: string | null | undefined): u is string {
  if (u == null || typeof u !== "string") return false;
  const t = u.trim();
  if (!t.startsWith("https://") && !t.startsWith("http://")) return false;
  return true;
}

let sendBot: TelegramBot | null = null;

/**
 * Bot instanca samo za slanje poruka (bez pollinga) — Next/worker dele isti token.
 */
function getSendBot(): TelegramBot | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  if (!sendBot) {
    sendBot = new TelegramBot(token, { polling: false });
  }
  return sendBot;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildListingMessageHtml(payload: TelegramListingPayload): string {
  return (
    `🔥 <b>New Listing Found!</b>\n\n` +
    `<b>${escapeHtml(payload.title)}</b>\n` +
    `💰 ${escapeHtml(payload.price)}\n` +
    `📍 ${escapeHtml(payload.location)}`
  );
}

/** Kratka legenda ispod slike (naslov + cena; ostatak u istoj HTML poruci ako stane). */
function buildPhotoCaptionHtml(payload: TelegramListingPayload): string {
  let title = payload.title;
  let loc = payload.location;
  for (let i = 0; i < 8; i++) {
    const html =
      `<b>${escapeHtml(title)}</b>\n` +
      `💰 ${escapeHtml(payload.price)}\n` +
      `📍 ${escapeHtml(loc)}`;
    if (html.length <= TELEGRAM_PHOTO_CAPTION_MAX) return html;
    title = truncatePlain(title, Math.max(40, Math.floor(title.length * 0.8)));
    loc = truncatePlain(loc, Math.max(20, Math.floor(loc.length * 0.8)));
  }
  const fallback =
    `<b>${escapeHtml(truncatePlain(payload.title, 80))}</b>\n` +
    `💰 ${escapeHtml(payload.price)}`;
  return fallback.length <= TELEGRAM_PHOTO_CAPTION_MAX
    ? fallback
    : truncatePlain(fallback, TELEGRAM_PHOTO_CAPTION_MAX - 1) + "…";
}

/**
 * Šalje poruku na konkretan chat_id. Vraća false ako nema tokena ili slanje ne uspe.
 */
export async function sendListingToChat(
  chatId: string,
  payload: TelegramListingPayload
): Promise<boolean> {
  const bot = getSendBot();
  if (!bot) return false;
  const id = String(chatId).trim();
  if (!id) return false;

  const reply_markup = {
    inline_keyboard: [[{ text: "Otvori oglas", url: payload.url }]],
  };

  const imageUrl = payload.image_url?.trim();
  if (isPublicHttpImageUrl(imageUrl)) {
    try {
      await bot.sendPhoto(id, imageUrl, {
        caption: buildPhotoCaptionHtml(payload),
        parse_mode: "HTML",
        reply_markup,
      });
      return true;
    } catch (e) {
      console.error("[telegram] sendPhoto failed, fallback na tekst:", e);
    }
  }

  try {
    await bot.sendMessage(id, buildListingMessageHtml(payload), {
      parse_mode: "HTML",
      reply_markup,
    });
    return true;
  } catch (e) {
    console.error("[telegram] sendMessage failed:", e);
    return false;
  }
}
