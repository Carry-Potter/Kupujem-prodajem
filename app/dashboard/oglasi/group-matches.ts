import type { DbAlert, MatchWithDetails } from "@/types/database";

export type MatchSection = {
  alertId: string;
  keyword: string;
  isActive: boolean;
  sortTime: number;
  matches: MatchWithDetails[];
};

/** Grupiše mečeve po upozorenju; sekcije su sortirane po najnovijem oglasu u grupi. */
export function groupMatchesByAlert(
  matches: MatchWithDetails[],
  alerts: DbAlert[]
): MatchSection[] {
  const map = new Map<string, MatchWithDetails[]>();
  const meta = new Map<
    string,
    { keyword: string; isActive: boolean; sortTime: number }
  >();

  for (const alert of alerts) {
    map.set(alert.id, []);
    meta.set(alert.id, {
      keyword: alert.keyword,
      isActive: alert.is_active,
      sortTime: new Date(alert.created_at).getTime(),
    });
  }

  for (const m of matches) {
    const id = m.alert?.id ?? "__orphan__";
    if (!map.has(id)) {
      map.set(id, []);
      meta.set(id, {
        keyword: m.alert?.keyword ?? "Upozorenje",
        isActive: m.alert?.is_active ?? false,
        sortTime: new Date(m.created_at).getTime(),
      });
    }
    map.get(id)!.push(m);
  }

  const sections: MatchSection[] = [];
  for (const [alertId, items] of Array.from(map.entries())) {
    const m0 = meta.get(alertId)!;
    items.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestMatchTime =
      items.length > 0
        ? Math.max(...items.map((x) => new Date(x.created_at).getTime()))
        : Number.NEGATIVE_INFINITY;
    sections.push({
      alertId,
      keyword: m0.keyword,
      isActive: m0.isActive,
      sortTime: Math.max(m0.sortTime, latestMatchTime),
      matches: items,
    });
  }

  sections.sort((a, b) => b.sortTime - a.sortTime);

  return sections;
}
