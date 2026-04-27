const TELEGRAM_API_BASE = "https://api.telegram.org";

function cleanBotUsername(v: string | undefined): string {
  return (v ?? "").replace(/^@/, "").trim();
}

export function getTelegramBotUsername(): string {
  return cleanBotUsername(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)
    || cleanBotUsername(process.env.TELEGRAM_BOT_USERNAME);
}

export function getTelegramWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET ?? "").trim();
}

function getTelegramToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
}

function buildWebhookUrl(baseUrl: string, secret: string): string {
  return `${baseUrl}/api/telegram/webhook/${encodeURIComponent(secret)}`;
}

export function hasWebhookConfig(): boolean {
  return Boolean(getTelegramToken() && getAppBaseUrl() && getTelegramWebhookSecret());
}

export async function ensureTelegramWebhookConfigured(): Promise<void> {
  const token = getTelegramToken();
  const baseUrl = getAppBaseUrl();
  const secret = getTelegramWebhookSecret();
  if (!token || !baseUrl || !secret) return;

  const url = `${TELEGRAM_API_BASE}/bot${token}/setWebhook`;
  const webhookUrl = buildWebhookUrl(baseUrl, secret);
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ["message"],
      drop_pending_updates: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`setWebhook HTTP ${res.status}`);
  }
  const body = (await res.json()) as { ok?: boolean; description?: string };
  if (!body.ok) {
    throw new Error(body.description ?? "setWebhook failed");
  }
}

