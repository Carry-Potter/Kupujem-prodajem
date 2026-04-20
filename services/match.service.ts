import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbAd, MatchWithDetails } from "@/types/database";

type RawMatchRow = {
  id: string;
  created_at: string;
  sent: boolean;
  alert_id: string;
  ad_id: string;
  archived_to_history?: boolean;
};

export type ListMatchesOptions = {
  /** Samo mečevi čije je upozorenje i dalje aktivno, bez onih prebačenih u istoriju */
  onlyActiveAlerts?: boolean;
};

/**
 * Svi mečevi vidljivi korisniku (RLS na matches).
 * Oglase i upozorenja učitavamo odvojenim upitima — ugnježdeni `ads(...)` u PostgREST-u
 * ponekad ne vrati redove (RLS/embed), pa lista ostane bez naslova/cene.
 */
export async function listMatchesWithDetails(
  supabase: SupabaseClient,
  options?: ListMatchesOptions
): Promise<MatchWithDetails[]> {
  let rows: RawMatchRow[];
  {
    const res = await supabase
      .from("matches")
      .select("id, created_at, sent, alert_id, ad_id, archived_to_history")
      .order("created_at", { ascending: false });
    if (
      res.error &&
      /archived_to_history|column .* does not exist/i.test(res.error.message)
    ) {
      const res2 = await supabase
        .from("matches")
        .select("id, created_at, sent, alert_id, ad_id")
        .order("created_at", { ascending: false });
      if (res2.error) throw new Error(res2.error.message);
      rows = (res2.data ?? []) as RawMatchRow[];
    } else if (res.error) {
      throw new Error(res.error.message);
    } else {
      rows = (res.data ?? []) as RawMatchRow[];
    }
  }
  if (rows.length === 0) {
    return [];
  }

  const alertIds = Array.from(new Set(rows.map((r) => r.alert_id)));
  const adIds = Array.from(new Set(rows.map((r) => r.ad_id)));

  const [alertsRes, adsRes] = await Promise.all([
    supabase
      .from("alerts")
      .select("id, keyword, is_active")
      .in("id", alertIds),
    supabase.from("ads").select("*").in("id", adIds),
  ]);

  if (alertsRes.error) {
    throw new Error(alertsRes.error.message);
  }
  if (adsRes.error) {
    throw new Error(adsRes.error.message);
  }

  const alertById = new Map(
    (alertsRes.data ?? []).map((a) => [
      a.id,
      { id: a.id, keyword: a.keyword, is_active: a.is_active },
    ])
  );
  const adById = new Map(
    (adsRes.data ?? []).map((ad) => {
      const row = ad as Record<string, unknown>;
      const d: DbAd = {
        id: String(row.id),
        title: String(row.title ?? ""),
        price: row.price != null ? Number(row.price) : null,
        location: row.location != null ? String(row.location) : null,
        url: String(row.url ?? ""),
        image_url:
          row.image_url != null && String(row.image_url).length > 0
            ? String(row.image_url)
            : null,
        description_snippet:
          row.description_snippet != null &&
          String(row.description_snippet).length > 0
            ? String(row.description_snippet)
            : null,
        created_at: String(row.created_at ?? ""),
      };
      return [d.id, d];
    })
  );

  let mapped: MatchWithDetails[] = rows.map((row) => ({
    id: row.id,
    created_at: row.created_at,
    sent: row.sent,
    archived_to_history: row.archived_to_history === true,
    alert: alertById.get(row.alert_id) ?? null,
    ad: adById.get(row.ad_id) ?? null,
  }));

  if (options?.onlyActiveAlerts) {
    mapped = mapped.filter(
      (m) =>
        m.alert?.is_active === true && m.archived_to_history !== true
    );
  }

  return mapped;
}
