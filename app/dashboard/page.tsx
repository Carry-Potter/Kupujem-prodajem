import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAlertsForUser } from "@/services/alert.service";
import { getProfile } from "@/services/user.service";
import { FREE_ALERT_LIMIT } from "@/services/plan";
import type { KpCondition } from "@/types/database";

const KP_CONDITION_LABEL: Record<KpCondition, string> = {
  new: "Novo",
  "as-new": "Nekorišćeno",
  used: "Korišćeno",
  damaged: "Neispravno",
};
import {
  deleteAlertFormAction,
  toggleAlertFormAction,
} from "@/app/dashboard/actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const [alerts, profile] = await Promise.all([
    listAlertsForUser(supabase, user.id),
    getProfile(supabase, user.id),
  ]);

  const plan = profile?.plan ?? "free";
  const atLimit = plan === "free" && alerts.length >= FREE_ALERT_LIMIT;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kontrolna tabla
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Plan:{" "}
            <span className="font-semibold text-slate-800">
              {plan === "pro" ? "Pro" : "Besplatni"}
            </span>
            {plan === "free" && (
              <>
                {" "}
                · najviše {FREE_ALERT_LIMIT} upozorenja · osvežavanje do ~24h
              </>
            )}
            {plan === "pro" && <> · neograničeno upozorenja · ~5 min sken</>}
          </p>
          <p className="mt-2">
            <Link
              href="/dashboard/oglasi"
              className="text-sm font-medium text-sky-600 hover:text-sky-800"
            >
              Pronađeni oglasi koji odgovaraju kriterijumima →
            </Link>
          </p>
        </div>
        {atLimit ? (
          <span
            className="inline-flex cursor-not-allowed justify-center rounded-lg bg-slate-400 px-4 py-2 text-center text-sm font-medium text-white"
            title="Limit besplatnog plana"
          >
            Novo upozorenje
          </span>
        ) : (
          <Link
            href="/dashboard/upozorenja/nova"
            className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-sky-700"
          >
            Novo upozorenje
          </Link>
        )}
      </div>
      {atLimit && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Dostigao si limit za besplatni plan. Obriši neko upozorenje ili
          traži nadogradnju na Pro (ručno u bazi:{" "}
          <code className="rounded bg-amber-100 px-1">plan = pro</code>).
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {alerts.length === 0 ? (
          <p className="p-8 text-center text-slate-600">
            Još nemaš upozorenja.{" "}
            <Link href="/dashboard/upozorenja/nova" className="text-sky-600">
              Dodaj prvo
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{a.keyword}</p>
                  <p className="text-sm text-slate-600">
                    Cena:{" "}
                    {a.min_price != null
                      ? `${Number(a.min_price)} – `
                      : "do "}
                    {Number(a.max_price)} EUR · Lokacija:{" "}
                    {a.location?.trim() ? a.location : "bilo gde"} · Prati{" "}
                    {a.cheapest_limit ?? 20} najjeft.
                    {a.kp_condition
                      ? ` · Stanje: ${KP_CONDITION_LABEL[a.kp_condition]}`
                      : ""}
                    {a.search_in_description === true
                      ? " · Pretraga: naslov + tekst"
                      : " · Pretraga: naslov"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.is_active ? "Aktivno" : "Pauzirano"}
                    {a.last_scraped_at
                      ? ` · poslednji sken: ${new Date(a.last_scraped_at).toLocaleString("sr-RS")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={toggleAlertFormAction}>
                    <input type="hidden" name="alert_id" value={a.id} />
                    <input
                      type="hidden"
                      name="next_active"
                      value={String(!a.is_active)}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {a.is_active ? "Pauziraj" : "Aktiviraj"}
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/upozorenja/${a.id}/uredi`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Izmeni
                  </Link>
                  <form action={deleteAlertFormAction}>
                    <input type="hidden" name="alert_id" value={a.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                    >
                      Obriši
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
