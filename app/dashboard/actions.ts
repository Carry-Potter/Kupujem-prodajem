"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createAlert,
  deleteAlert,
  normalizeKpCondition,
  setAlertActive,
  updateAlert,
} from "@/services/alert.service";
import { updateTelegramChatId } from "@/services/user.service";
import { tryImmediateScrapeForAlert } from "@/services/immediate-scrape";
import { agentLog } from "@/lib/debug-agent-log";

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createAlertAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const keyword = String(formData.get("keyword") ?? "");
  const max_price = Number(formData.get("max_price"));
  const minRaw = formData.get("min_price");
  const min_price =
    minRaw === "" || minRaw == null ? null : Number(minRaw);
  const location = String(formData.get("location") ?? "");
  const cheapest_limit = Number(formData.get("cheapest_limit") ?? 20);
  const kp_condition = normalizeKpCondition(formData.get("kp_condition"));
  const search_in_description =
    String(formData.get("search_in_description") ?? "") === "on";

  let createdId: string | undefined;
  try {
    const created = await createAlert(supabase, user.id, {
      keyword,
      max_price,
      min_price,
      location,
      is_active: true,
      cheapest_limit,
      kp_condition,
      search_in_description,
    });
    createdId = created.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Greška pri čuvanju." };
  }

  if (createdId) {
    // #region agent log
    agentLog(
      "actions.ts:createAlertAction",
      "before_immediate_scrape",
      { createdId },
      "H1"
    );
    // #endregion
    await tryImmediateScrapeForAlert(createdId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oglasi");
  redirect("/dashboard");
}

export async function updateAlertAction(alertId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const keyword = String(formData.get("keyword") ?? "");
  const max_price = Number(formData.get("max_price"));
  const minRaw = formData.get("min_price");
  const min_price =
    minRaw === "" || minRaw == null ? null : Number(minRaw);
  const location = String(formData.get("location") ?? "");
  const cheapest_limit = Number(formData.get("cheapest_limit") ?? 20);
  const kp_condition = normalizeKpCondition(formData.get("kp_condition"));
  const search_in_description =
    String(formData.get("search_in_description") ?? "") === "on";

  try {
    await updateAlert(supabase, user.id, alertId, {
      keyword,
      max_price,
      min_price,
      location,
      cheapest_limit,
      kp_condition,
      search_in_description,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Greška pri čuvanju." };
  }

  await tryImmediateScrapeForAlert(alertId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oglasi");
  redirect("/dashboard");
}

export async function deleteAlertFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("alert_id") ?? "");
  await deleteAlertAction(id);
}

export async function deleteAlertAction(alertId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  try {
    await deleteAlert(supabase, user.id, alertId);
  } catch (e) {
    console.error("[notifyKP] Brisanje upozorenja:", e);
  }

  revalidatePath("/dashboard");
}

export async function toggleAlertAction(
  alertId: string,
  isActive: boolean
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  try {
    await setAlertActive(supabase, user.id, alertId, isActive);
  } catch (e) {
    console.error("[notifyKP] Promena statusa upozorenja:", e);
  }

  if (isActive) {
    await tryImmediateScrapeForAlert(alertId);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/oglasi");
}

export async function toggleAlertFormAction(formData: FormData): Promise<void> {
  const id = String(formData.get("alert_id") ?? "");
  const isActive = String(formData.get("next_active") ?? "") === "true";
  await toggleAlertAction(id, isActive);
}

/**
 * Pojedinačan meč: sakrij iz „Aktivna upozorenja” ili vrati nazad.
 * Zahteva kolonu matches.archived_to_history (migracija 003).
 */
export async function setMatchArchivedAction(
  matchId: string,
  archived: boolean
): Promise<{ error: string } | { ok: true }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const { error } = await supabase
    .from("matches")
    .update({ archived_to_history: archived })
    .eq("id", matchId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/oglasi");
  return { ok: true };
}

export async function saveTelegramAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const raw = String(formData.get("telegram_chat_id") ?? "").trim();
  const telegram_chat_id = raw.length ? raw : null;

  try {
    await updateTelegramChatId(supabase, user.id, telegram_chat_id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Čuvanje nije uspelo." };
  }

  revalidatePath("/dashboard/podesavanja");
  return { ok: true as const };
}
