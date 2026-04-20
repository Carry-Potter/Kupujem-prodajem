import { ListingImage } from "@/components/ListingImage";
import { MatchHistoryActions } from "@/components/MatchHistoryActions";
import type { MatchWithDetails } from "@/types/database";

export function MatchListRow({
  m,
  svi,
}: {
  m: MatchWithDetails;
  svi: boolean;
}) {
  return (
    <article className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
        {m.ad?.image_url ? (
          <ListingImage
            src={m.ad.image_url}
            alt={m.ad.title ?? "Oglas"}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {m.alert && !m.alert.is_active && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                Pauzirano upozorenje
              </span>
            )}
            {m.sent ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Telegram poslat
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                Telegram nije poslat
              </span>
            )}
            {svi && m.archived_to_history ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                Samo u istoriji
              </span>
            ) : null}
          </div>
          {m.ad ? (
            <>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                {m.ad.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {m.ad.price != null
                  ? `${Number(m.ad.price).toLocaleString("de-DE", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })} €`
                  : "Cena nije poznata"}
                {m.ad.location ? ` · ${m.ad.location}` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Uparivanje:{" "}
                {new Date(m.created_at).toLocaleString("sr-RS")}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-amber-800">
              Podaci o oglasu nisu dostupni (id: {m.id.slice(0, 8)}…).
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {!svi ? (
          <MatchHistoryActions matchId={m.id} variant="to-history" />
        ) : m.archived_to_history ? (
          <MatchHistoryActions matchId={m.id} variant="restore" />
        ) : null}
        {m.ad?.url ? (
          <a
            href={m.ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Otvori oglas
          </a>
        ) : null}
      </div>
    </article>
  );
}
