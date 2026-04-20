import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertInput, DbAlert, KpCondition } from "@/types/database";
import { FREE_ALERT_LIMIT } from "@/services/plan";
import { getProfile } from "@/services/user.service";

export async function listAlertsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<DbAlert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DbAlert[];
}

export async function getAlertById(
  supabase: SupabaseClient,
  userId: string,
  alertId: string
): Promise<DbAlert | null> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as DbAlert | null;
}

async function countUserAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Dozvoljeno: 10, 20 ili 50 najjeftinijih pogodaka po skeniranju. */
export function normalizeCheapestLimit(v: unknown): number {
  const n = Number(v);
  if (n === 10 || n === 20 || n === 50) return n;
  return 20;
}

const KP_CONDITIONS: KpCondition[] = ["new", "as-new", "used", "damaged"];

/** null = bilo koje stanje (bez KP filtera) */
export function normalizeKpCondition(raw: unknown): KpCondition | null {
  const s = String(raw ?? "").trim();
  if (!s || s === "any") return null;
  return (KP_CONDITIONS as readonly string[]).includes(s)
    ? (s as KpCondition)
    : null;
}

function validatePrices(max: number, min: number | null | undefined) {
  if (!Number.isFinite(max) || max <= 0) {
    throw new Error("Maksimalna cena mora biti pozitivan broj.");
  }
  if (min != null) {
    if (!Number.isFinite(min) || min < 0) {
      throw new Error("Minimalna cena mora biti nenegativan broj.");
    }
    if (min > max) {
      throw new Error("Minimalna cena ne sme biti veća od maksimalne.");
    }
  }
}

export async function createAlert(
  supabase: SupabaseClient,
  userId: string,
  input: AlertInput
): Promise<DbAlert> {
  const profile = await getProfile(supabase, userId);
  if (!profile) throw new Error("Profil korisnika nije pronađen.");

  validatePrices(input.max_price, input.min_price);

  const n = await countUserAlerts(supabase, userId);
  if (profile.plan === "free" && n >= FREE_ALERT_LIMIT) {
    throw new Error(
      `Besplatni plan dozvoljava najviše ${FREE_ALERT_LIMIT} upozorenja. Nadogradite na Pro.`
    );
  }

  const row = {
    user_id: userId,
    keyword: input.keyword.trim(),
    max_price: input.max_price,
    min_price: input.min_price ?? null,
    location: input.location.trim(),
    is_active: input.is_active ?? true,
    cheapest_limit: normalizeCheapestLimit(input.cheapest_limit ?? 20),
    kp_condition: normalizeKpCondition(input.kp_condition),
    search_in_description: Boolean(input.search_in_description),
  };

  const { data, error } = await supabase
    .from("alerts")
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbAlert;
}

export async function updateAlert(
  supabase: SupabaseClient,
  userId: string,
  alertId: string,
  input: Partial<AlertInput>
): Promise<DbAlert> {
  const existing = await getAlertById(supabase, userId, alertId);
  if (!existing) throw new Error("Upozorenje nije pronađeno.");

  const nextMax = input.max_price ?? Number(existing.max_price);
  const nextMin =
    input.min_price !== undefined ? input.min_price : existing.min_price;
  validatePrices(nextMax, nextMin);

  const patch: Record<string, unknown> = {};
  if (input.keyword !== undefined) patch.keyword = input.keyword.trim();
  if (input.max_price !== undefined) patch.max_price = input.max_price;
  if (input.min_price !== undefined) patch.min_price = input.min_price;
  if (input.location !== undefined) patch.location = input.location.trim();
  if (input.is_active !== undefined) patch.is_active = input.is_active;
  if (input.cheapest_limit !== undefined) {
    patch.cheapest_limit = normalizeCheapestLimit(input.cheapest_limit);
  }
  if (input.kp_condition !== undefined) {
    patch.kp_condition = normalizeKpCondition(input.kp_condition);
  }
  if (input.search_in_description !== undefined) {
    patch.search_in_description = Boolean(input.search_in_description);
  }

  const { data, error } = await supabase
    .from("alerts")
    .update(patch)
    .eq("id", alertId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DbAlert;
}

export async function deleteAlert(
  supabase: SupabaseClient,
  userId: string,
  alertId: string
): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function setAlertActive(
  supabase: SupabaseClient,
  userId: string,
  alertId: string,
  isActive: boolean
): Promise<DbAlert> {
  return updateAlert(supabase, userId, alertId, { is_active: isActive });
}
