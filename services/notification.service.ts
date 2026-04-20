import type { DbAd } from "@/types/database";
import { sendListingToChat } from "@/lib/telegram";
import { listingPayloadFromDbAd } from "@/services/telegramService";

export type NotifyMatchPayload = {
  chatId: string;
  ad: DbAd;
};

/**
 * Direktno slanje na poznati chat_id (npr. testovi ili spoljni pozivi).
 * Produkcijski tok koristi {@link sendTelegramNotification} po userId.
 */
export async function sendTelegramMatch(
  payload: NotifyMatchPayload
): Promise<boolean> {
  return sendListingToChat(
    payload.chatId,
    listingPayloadFromDbAd(payload.ad)
  );
}
