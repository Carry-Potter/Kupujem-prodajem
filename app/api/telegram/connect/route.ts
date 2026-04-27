import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureTelegramWebhookConfigured,
  getTelegramBotUsername,
  hasWebhookConfig,
} from "@/lib/telegram-webhook";

export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/connect
 * Autentifikovani korisnik dobija jednokratni token i deep link ka botu.
 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = randomUUID();
  const { error: updateError } = await supabase
    .from("users")
    .update({ telegram_connect_token: token })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  const botUsername = getTelegramBotUsername();

  if (!botUsername) {
    return NextResponse.json(
      {
        error:
          "Nije podešen NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (ili TELEGRAM_BOT_USERNAME).",
      },
      { status: 500 }
    );
  }

  if (!hasWebhookConfig()) {
    return NextResponse.json(
      {
        error:
          "Webhook nije potpuno podešen. Dodaj TELEGRAM_WEBHOOK_SECRET i NEXT_PUBLIC_APP_URL u env.",
      },
      { status: 500 }
    );
  }

  try {
    await ensureTelegramWebhookConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Webhook setup nije uspeo: ${msg}` },
      { status: 500 }
    );
  }

  const connectUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;

  return NextResponse.json({ connectUrl });
}
