import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbAd } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  type TelegramListingPayload,
  sendListingToChat,
} from "@/lib/telegram";

function formatPrice(price: number | null): string {
  if (price == null || !Number.isFinite(Number(price))) {
    return "—";
  }
  return `${Number(price).toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

/** Mapiranje oglasa iz baze u payload za Telegram. */
export function listingPayloadFromDbAd(ad: DbAd): TelegramListingPayload {
  const img = ad.image_url?.trim();
  return {
    title: ad.title,
    price: formatPrice(ad.price),
    location: (ad.location?.trim() || "—") as string,
    url: ad.url,
    image_url: img && img.length > 0 ? img : null,
  };
}

/**
 * Šalje obaveštenje korisniku po userId ako ima sačuvan telegram_chat_id.
 * Koristi service role (isti kao worker) da pročita users bez browser sesije.
 */
export async function sendTelegramNotification(
  userId: string,
  payload: TelegramListingPayload
): Promise<boolean> {
  let admin: SupabaseClient;
  try {
    admin = createAdminClient();
  } catch {
    return false;
  }

  const { data, error } = await admin
    .from("users")
    .select("telegram_chat_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[telegramService] fetch user:", error.message);
    return false;
  }

  const chatId = data?.telegram_chat_id;
  if (chatId == null || String(chatId).trim() === "") {
    return false;
  }

  return sendListingToChat(String(chatId), payload);
}
