import type { Plan } from "@/types/database";

export const FREE_ALERT_LIMIT = 2;

/** Minimalni interval između dva skeniranja istog upozorenja (ms) */
export function scrapeIntervalMs(plan: Plan): number {
  return plan === "pro" ? 5 * 60 * 1000 : 24 * 60 * 60 * 1000;
}

export function shouldScrapeNow(
  plan: Plan,
  lastScrapedAt: string | null
): boolean {
  if (!lastScrapedAt) return true;
  const last = new Date(lastScrapedAt).getTime();
  return Date.now() - last >= scrapeIntervalMs(plan);
}
