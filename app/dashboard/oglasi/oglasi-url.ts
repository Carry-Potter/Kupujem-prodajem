import type { MatchSection } from "@/app/dashboard/oglasi/group-matches";

/** Query za /dashboard/oglasi (prikaz + tab upozorenja). */
export function buildOglasiHref(
  svi: boolean,
  tabAlertId: string,
  sections: MatchSection[],
  sort?: string
): string {
  const params = new URLSearchParams();
  if (svi) params.set("prikaz", "svi");
  if (sort && sort !== "datum_novo") params.set("sort", sort);
  const valid =
    tabAlertId && sections.some((s) => s.alertId === tabAlertId);
  if (valid) params.set("tab", tabAlertId);
  const q = params.toString();
  return q ? `/dashboard/oglasi?${q}` : "/dashboard/oglasi";
}

/** Link za prebacivanje Aktivna / Sva istorija (bez taba — prvi tab posle učitavanja). */
export function buildPrikazHref(svi: boolean, sort?: string): string {
  const params = new URLSearchParams();
  if (svi) params.set("prikaz", "svi");
  if (sort && sort !== "datum_novo") params.set("sort", sort);
  const q = params.toString();
  return q ? `/dashboard/oglasi?${q}` : "/dashboard/oglasi";
}
