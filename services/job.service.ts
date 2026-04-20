import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbAd, DbAlert, DbUser, Plan } from "@/types/database";
import { listingMatchesAlert } from "@/services/matching.service";
import {
  scrapeListingsForAlert,
  type ParsedListing,
} from "@/services/scraper.service";
import {
  listingPayloadFromDbAd,
  sendTelegramNotification,
} from "@/services/telegramService";
import { shouldScrapeNow } from "@/services/plan";
import { agentLog } from "@/lib/debug-agent-log";

export type AlertWithUser = DbAlert & {
  users: Pick<DbUser, "plan" | "telegram_chat_id" | "email"> | null;
};

/**
 * Učitava sva aktivna upozorenja sa podacima korisnika (plan, Telegram).
 */
export async function fetchActiveAlertsWithUsers(
  admin: SupabaseClient
): Promise<AlertWithUser[]> {
  const { data, error } = await admin
    .from("alerts")
    .select("*, users ( plan, telegram_chat_id, email )")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as AlertWithUser[];
}

function parsedListingToDbAd(l: ParsedListing): DbAd {
  return {
    id: l.externalId,
    title: l.title,
    price: l.price,
    location: l.location,
    url: l.url,
    image_url: l.imageUrl ?? null,
    description_snippet: l.descriptionSnippet,
    created_at: "",
  };
}

function compareParsedByPriceAsc(a: ParsedListing, b: ParsedListing): number {
  const pa = a.price ?? Number.POSITIVE_INFINITY;
  const pb = b.price ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  return a.externalId.localeCompare(b.externalId);
}

/** Iz baze ili podrazumevano 20 */
function normalizeCheapestLimit(raw: unknown): number {
  const v = Number(raw);
  if (v === 10 || v === 20 || v === 50) return v;
  return 20;
}

async function persistAd(
  admin: SupabaseClient,
  listing: ParsedListing
): Promise<DbAd> {
  const base = {
    id: listing.externalId,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    url: listing.url,
  };
  const withImage = {
    ...base,
    image_url: listing.imageUrl ?? null,
  };
  const withSnippet = {
    ...withImage,
    description_snippet:
      listing.descriptionSnippet != null && listing.descriptionSnippet !== ""
        ? listing.descriptionSnippet
        : null,
  };
  let { error } = await admin.from("ads").upsert(withSnippet, {
    onConflict: "id",
  });
  if (
    error &&
    /image_url|description_snippet|column .* does not exist/i.test(
      error.message ?? ""
    )
  ) {
    ({ error } = await admin.from("ads").upsert(withImage, {
      onConflict: "id",
    }));
  }
  if (
    error &&
    /image_url|column .* does not exist/i.test(error.message ?? "")
  ) {
    ({ error } = await admin.from("ads").upsert(base, { onConflict: "id" }));
  }
  if (error) throw new Error(error.message);

  return {
    ...base,
    image_url: listing.imageUrl ?? null,
    description_snippet: withSnippet.description_snippet,
    created_at: new Date().toISOString(),
  };
}

async function createMatchIfNeeded(
  admin: SupabaseClient,
  alertId: string,
  adId: string
): Promise<boolean> {
  const { error } = await admin.from("matches").insert({
    alert_id: alertId,
    ad_id: adId,
    sent: false,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}

export type ProcessAlertOptions = {
  /** Preskače interval (free 24h / pro 5 min) – pri kreiranju ili ručnom okidanju */
  force?: boolean;
};

/**
 * Jedan ciklus za jedno upozorenje: skeniranje, novi oglasi, mečevi, Telegram.
 */
export async function processAlert(
  admin: SupabaseClient,
  alertRow: AlertWithUser,
  allActiveAlerts: DbAlert[],
  options?: ProcessAlertOptions
): Promise<void> {
  console.info(
    `[notifyKP] processAlert start: alert=${alertRow.id}, force=${Boolean(options?.force)}`
  );
  const plan: Plan = alertRow.users?.plan === "pro" ? "pro" : "free";
  if (
    !options?.force &&
    !shouldScrapeNow(plan, alertRow.last_scraped_at)
  ) {
    // #region agent log
    agentLog(
      "job.service.ts:processAlert",
      "skipped_interval",
      { alertId: alertRow.id, plan, force: !!options?.force },
      "H4"
    );
    // #endregion
    return;
  }

  let listings: ParsedListing[];
  let newMatchCount = 0;
  try {
    listings = await scrapeListingsForAlert(alertRow);
  } catch (e) {
    console.error("[notifyKP] Greška pri skeniranju:", alertRow.id, e);
    // #region agent log
    agentLog(
      "job.service.ts:processAlert",
      "scrape_throw",
      {
        alertId: alertRow.id,
        err: e instanceof Error ? e.message.slice(0, 120) : "unknown",
      },
      "H2"
    );
    // #endregion
    return;
  }

  // #region agent log
  agentLog(
    "job.service.ts:processAlert",
    "scrape_ok",
    {
      alertId: alertRow.id,
      listingsCount: listings.length,
      force: !!options?.force,
    },
    "H2"
  );
  // #endregion
  console.info(
    `[notifyKP] processAlert scrape_ok: alert=${alertRow.id}, listings=${listings.length}`
  );

  const allowedIdsByAlert = new Map<string, Set<string>>();
  for (const a of allActiveAlerts) {
    if (!a.is_active) continue;
    const lim = normalizeCheapestLimit(a.cheapest_limit);
    const matching = listings
      .filter((l) => listingMatchesAlert(a, parsedListingToDbAd(l)))
      .sort(compareParsedByPriceAsc)
      .slice(0, lim);
    allowedIdsByAlert.set(
      a.id,
      new Set(matching.map((l) => l.externalId))
    );
  }

  const now = new Date().toISOString();
  await admin
    .from("alerts")
    .update({ last_scraped_at: now })
    .eq("id", alertRow.id);

  for (const listing of listings) {
    const ad = await persistAd(admin, listing);

    for (const a of allActiveAlerts) {
      if (!a.is_active) continue;
      if (!listingMatchesAlert(a, ad)) continue;
      if (!allowedIdsByAlert.get(a.id)?.has(listing.externalId)) continue;
      const inserted = await createMatchIfNeeded(admin, a.id, ad.id);
      if (!inserted) continue;
      newMatchCount += 1;

      try {
        const sent = await sendTelegramNotification(
          a.user_id,
          listingPayloadFromDbAd(ad)
        );
        if (sent) {
          await admin
            .from("matches")
            .update({ sent: true })
            .eq("alert_id", a.id)
            .eq("ad_id", ad.id);
        }
      } catch (err) {
        console.error("[notifyKP] Telegram greška:", err);
      }
    }
  }

  // #region agent log
  agentLog(
    "job.service.ts:processAlert",
    "processAlert_done",
    {
      alertId: alertRow.id,
      listingsCount: listings.length,
      newMatchCount,
    },
    "H3"
  );
  // #endregion
  console.info(
    `[notifyKP] processAlert done: alert=${alertRow.id}, newMatches=${newMatchCount}`
  );
}

/**
 * Pun ciklus worker-a: sva upozorenja koja su na redu po planu.
 */
export async function runScrapeCycle(admin: SupabaseClient): Promise<void> {
  const withUsers = await fetchActiveAlertsWithUsers(admin);
  const allActiveAlerts = withUsers.map((r) => {
    const { users: _u, ...rest } = r;
    return rest as DbAlert;
  });

  for (const row of withUsers) {
    try {
      await processAlert(admin, row, allActiveAlerts);
    } catch (e) {
      console.error("[notifyKP] processAlert:", row.id, e);
    }
  }
}

/**
 * Odmah skenira jedno upozorenje (npr. posle kreiranja u aplikaciji).
 * Zahteva SUPABASE_SERVICE_ROLE_KEY na serveru.
 */
export async function runImmediateScrapeForAlertId(
  admin: SupabaseClient,
  alertId: string
): Promise<void> {
  const { data: row, error } = await admin
    .from("alerts")
    .select("*, users ( plan, telegram_chat_id, email )")
    .eq("id", alertId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) {
    // #region agent log
    agentLog(
      "job.service.ts:runImmediateScrapeForAlertId",
      "alert_row_null",
      { alertId },
      "H5"
    );
    // #endregion
    return;
  }

  const alertRow = row as AlertWithUser;
  // #region agent log
  agentLog(
    "job.service.ts:runImmediateScrapeForAlertId",
    "alert_loaded",
    {
      alertId,
      kwLen: alertRow.keyword?.length ?? 0,
      maxPrice: Number(alertRow.max_price),
    },
    "H5"
  );
  // #endregion
  const all = await fetchActiveAlertsWithUsers(admin);
  const allActiveAlerts = all.map((r) => {
    const { users: _u, ...rest } = r;
    return rest as DbAlert;
  });

  await processAlert(admin, alertRow, allActiveAlerts, { force: true });
}
