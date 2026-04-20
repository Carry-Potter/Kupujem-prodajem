import { createAdminClient } from "@/lib/supabase/admin";
import { agentLog } from "@/lib/debug-agent-log";
import { runImmediateScrapeForAlertId } from "@/services/job.service";

/**
 * Poziva KP sken za upozorenje odmah (service role).
 * Ne baca ako nema ključa – samo loguje (korisnik i dalje može worker).
 */
export async function tryImmediateScrapeForAlert(alertId: string): Promise<void> {
  console.info(`[notifyKP] Immediate scrape start: alert=${alertId}`);
  // #region agent log
  agentLog(
    "immediate-scrape.ts:tryImmediateScrapeForAlert",
    "start",
    { alertId },
    "H1"
  );
  // #endregion
  try {
    const admin = createAdminClient();
    // #region agent log
    agentLog(
      "immediate-scrape.ts:tryImmediateScrapeForAlert",
      "admin_client_ok",
      { alertId },
      "H1"
    );
    // #endregion
    await runImmediateScrapeForAlertId(admin, alertId);
    console.info(`[notifyKP] Immediate scrape done: alert=${alertId}`);
    // #region agent log
    agentLog(
      "immediate-scrape.ts:tryImmediateScrapeForAlert",
      "runImmediateScrapeForAlertId_done",
      { alertId },
      "H1"
    );
    // #endregion
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      msg.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      msg.includes("SUPABASE_SECRET_KEY")
    ) {
      console.warn(
        "[notifyKP] Dodaj SUPABASE_SERVICE_ROLE_KEY ili SUPABASE_SECRET_KEY u .env.local (Supabase → API → service_role / secret). Bez toga odmah skeniranje i worker ne mogu pisati u bazu."
      );
    } else {
      console.error("[notifyKP] Odmah skeniranje:", e);
    }
    // #region agent log
    agentLog(
      "immediate-scrape.ts:tryImmediateScrapeForAlert",
      "catch",
      {
        alertId,
        errMsg: msg.slice(0, 200),
        isMissingKey:
          msg.includes("SUPABASE_SERVICE_ROLE_KEY") ||
          msg.includes("SUPABASE_SECRET_KEY"),
      },
      "H1"
    );
    // #endregion
  }
}
