import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTelegramWebhookSecret } from "@/lib/telegram-webhook";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
  };
};

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    console.error("[telegram-webhook] sendMessage HTTP", res.status);
  }
}

function parseStartToken(text: string): string | null {
  const m = text.trim().match(/^\/start(?:@\w+)?(?:\s+(\S+))?$/i);
  return m?.[1]?.trim() ?? null;
}

export async function POST(
  req: Request,
  ctx: { params: { secret: string } }
) {
  const configuredSecret = getTelegramWebhookSecret();
  if (!configuredSecret || ctx.params.secret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TelegramUpdate;
  try {
    body = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = body.message?.text?.trim() ?? "";
  const rawChatId = body.message?.chat?.id;
  const chatId = rawChatId != null ? String(rawChatId).trim() : "";
  if (!text || !chatId) {
    return NextResponse.json({ ok: true });
  }

  const connectToken = parseStartToken(text);
  if (!connectToken) {
    if (/^\/chatid(?:@\w+)?$/i.test(text)) {
      await sendTelegramMessage(chatId, `Tvoj chat ID je: ${chatId}`);
    } else if (/^\/start(?:@\w+)?$/i.test(text)) {
      await sendTelegramMessage(
        chatId,
        `Zdravo! Otvori link iz aplikacije (Povezi Telegram) da dovrsis povezivanje.\n\nAko zelis rucno povezivanje, tvoj chat ID je: ${chatId}`
      );
    }
    return NextResponse.json({ ok: true });
  }

  try {
    const admin = createAdminClient();
    const { data: row, error: findErr } = await admin
      .from("users")
      .select("id")
      .eq("telegram_connect_token", connectToken)
      .maybeSingle();

    if (findErr) {
      console.error("[telegram-webhook] lookup:", findErr.message);
      await sendTelegramMessage(
        chatId,
        "Greska pri povezivanju. Pokusaj ponovo iz aplikacije."
      );
      return NextResponse.json({ ok: true });
    }

    if (!row?.id) {
      await sendTelegramMessage(
        chatId,
        "Link je nevazeci ili je vec iskoriscen. Generisi novi u podesavanjima aplikacije."
      );
      return NextResponse.json({ ok: true });
    }

    const userId = String(row.id);
    await admin
      .from("users")
      .update({ telegram_chat_id: null })
      .eq("telegram_chat_id", chatId)
      .neq("id", userId);

    const { error: updErr } = await admin
      .from("users")
      .update({ telegram_chat_id: chatId, telegram_connect_token: null })
      .eq("id", userId);

    if (updErr) {
      console.error("[telegram-webhook] update:", updErr.message);
      await sendTelegramMessage(
        chatId,
        "Nije uspelo cuvanje. Pokusaj ponovo ili kontaktiraj podrsku."
      );
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(
      chatId,
      "Nalog je povezan. Dobijaces obavestenja kada pronadjemo novi oglas koji odgovara tvom upozorenju."
    );
  } catch (e) {
    console.error("[telegram-webhook] unexpected:", e);
    await sendTelegramMessage(chatId, "Neocekivana greska. Pokusaj ponovo.");
  }

  return NextResponse.json({ ok: true });
}

