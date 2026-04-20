import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMatchesWithDetails } from "@/services/match.service";
import { listAlertsForUser } from "@/services/alert.service";
import { groupMatchesByAlert } from "@/app/dashboard/oglasi/group-matches";
import { MatchListRow } from "@/app/dashboard/oglasi/MatchListRow";
import {
  buildOglasiHref,
  buildPrikazHref,
} from "@/app/dashboard/oglasi/oglasi-url";

type Props = {
  searchParams: { prikaz?: string; tab?: string };
};

export default async function OglasiPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const svi = searchParams.prikaz === "svi";
  const tabParam = searchParams.tab?.trim() ?? "";

  let matches: Awaited<ReturnType<typeof listMatchesWithDetails>> = [];
  let alerts: Awaited<ReturnType<typeof listAlertsForUser>> = [];
  let loadError: string | null = null;
  try {
    [matches, alerts] = await Promise.all([
      listMatchesWithDetails(supabase, {
        onlyActiveAlerts: !svi,
      }),
      listAlertsForUser(supabase, user.id),
    ]);
  } catch (e) {
    loadError =
      e instanceof Error ? e.message : "Nepoznata greška pri učitavanju.";
  }

  const visibleAlerts = svi ? alerts : alerts.filter((a) => a.is_active);
  const sections = groupMatchesByAlert(matches, visibleAlerts);
  const activeSection =
    sections.find((s) => s.alertId === tabParam) ?? sections[0] ?? null;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Pronađeni oglasi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Izaberi upozorenje u tabovima ispod; prikazuje se samo jedna grupa
            oglasa radi preglednosti.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-1 text-sm">
          <Link
            href={buildPrikazHref(false)}
            className={`rounded-md px-3 py-1.5 font-medium ${
              !svi
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Aktivna upozorenja
          </Link>
          <Link
            href={buildPrikazHref(true)}
            className={`rounded-md px-3 py-1.5 font-medium ${
              svi
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Sva istorija
          </Link>
        </div>
      </div>

      {loadError && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {loadError}
        </p>
      )}

      {!svi && (
        <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          Prikazuju se samo oglasi za <strong>aktivna</strong> upozorenja, bez
          onih koje si prebacio u istoriju. Za pauzirana upozorenja i arhivu
          koristi „Sva istorija”.
        </p>
      )}

      <div className="mt-6">
        {sections.length === 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            <p>Još nema upozorenja za ovaj prikaz.</p>
            <p className="mt-2 text-sm">
              Napravi upozorenje na kontrolnoj tabli, pa će se ovde odmah
              pojaviti njegova sekcija.{" "}
              <Link
                href="/dashboard/upozorenja/nova"
                className="font-medium text-sky-600"
              >
                Novo upozorenje
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div
              className="sticky top-0 z-10 -mx-1 border-b border-slate-200 bg-slate-50/95 px-1 pb-px backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border sm:border-b-0 sm:border-slate-200 sm:px-0"
              role="tablist"
              aria-label="Upozorenja"
            >
              <div className="flex gap-1 overflow-x-auto pb-0 pt-1 sm:gap-0 sm:px-2 sm:pt-2">
                {sections.map((s) => {
                  const active = activeSection?.alertId === s.alertId;
                  const href = buildOglasiHref(svi, s.alertId, sections);
                  return (
                    <Link
                      key={s.alertId}
                      href={href}
                      role="tab"
                      aria-selected={active}
                      className={`shrink-0 whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                        active
                          ? "border-slate-200 bg-white text-sky-800 shadow-sm"
                          : "border-transparent bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900"
                      }`}
                    >
                      <span className="max-w-[10rem] truncate sm:max-w-[14rem]">
                        {s.keyword}
                      </span>
                      <span
                        className={`ml-1.5 tabular-nums ${
                          active ? "text-sky-600" : "text-slate-400"
                        }`}
                      >
                        ({s.matches.length})
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {activeSection ? (
              <div className="overflow-hidden rounded-b-xl border border-t-0 border-slate-200 bg-white shadow-sm sm:border sm:border-t-0">
                <header className="flex flex-col gap-2 border-b border-slate-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-900">
                      {activeSection.keyword}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {activeSection.matches.length} pronađenih oglasa
                      {activeSection.isActive ? (
                        <span className="text-emerald-700">
                          {" "}
                          · aktivno upozorenje
                        </span>
                      ) : (
                        <span className="text-amber-800">
                          {" "}
                          · pauzirano upozorenje
                        </span>
                      )}
                    </p>
                  </div>
                  {activeSection.alertId !== "__orphan__" ? (
                    <Link
                      href={`/dashboard/upozorenja/${activeSection.alertId}/uredi`}
                      className="shrink-0 text-sm font-medium text-sky-600 hover:text-sky-800"
                    >
                      Izmeni upozorenje →
                    </Link>
                  ) : null}
                </header>
                {activeSection.matches.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {activeSection.matches.map((m) => (
                      <MatchListRow key={m.id} m={m} svi={svi} />
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-slate-600">
                    {activeSection.isActive
                      ? "Još nema pronađenih aktivnih oglasa za ovo upozorenje."
                      : "Za ovo pauzirano upozorenje trenutno nema sačuvanih oglasa."}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
