import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            notifyKP
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Uhvati dobar oglas pre drugih
          </h1>
          <p className="mt-5 text-lg text-slate-600 sm:text-xl">
            Napravi upozorenje po ključnoj reči, ceni i lokaciji, a notifyKP će
            automatski pratiti nove oglase i poslati ti Telegram poruku čim se
            pojavi odgovarajući rezultat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-700">
            <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 shadow-sm">
              Brza Telegram obaveštenja
            </span>
            <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 shadow-sm">
              Filteri po ceni i lokaciji
            </span>
            <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 shadow-sm">
              Aktivna upozorenja + istorija
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/registracija"
              className="rounded-xl bg-sky-600 px-6 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700"
            >
              Započni besplatno
            </Link>
            <Link
              href="/prijava"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800 transition hover:bg-slate-50"
            >
              Prijava
            </Link>
          </div>
        </div>

        <section className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Kako aplikacija radi
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Korak 1
              </p>
              <p className="mt-2 font-medium text-slate-900">
                Napravi upozorenje
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Unesi ključnu reč, opseg cene, lokaciju i dodatne filtere.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Korak 2
              </p>
              <p className="mt-2 font-medium text-slate-900">
                notifyKP automatski prati oglase
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Sistem periodično skenira rezultate i čuva samo relevantne
                pogodke.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Korak 3
              </p>
              <p className="mt-2 font-medium text-slate-900">
                Dobijaš Telegram notifikaciju
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Čim se pojavi novi oglas, otvaraš ga jednim klikom iz poruke.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Jasni filteri</h3>
            <p className="mt-2 text-sm text-slate-600">
              Pretraga po naslovu, ceni, lokaciji i stanju predmeta daje manje
              šuma i brže pronalazi ono što ti stvarno treba.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Pregledna kontrolna tabla
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Na jednom mestu vidiš aktivna upozorenja, istoriju pronađenih
              oglasa i status slanja notifikacija.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Planovi po meri
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Besplatni plan ima do 2 upozorenja, a Pro donosi neograničen broj
              upozorenja i češće osvežavanje.
            </p>
          </div>
        </div>

        <section className="mx-auto mt-10 flex max-w-4xl flex-col items-center rounded-2xl border border-sky-200 bg-sky-50 px-6 py-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Spreman da pronađeš sledeći oglas?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Registracija traje manje od minuta. Napravi prvo upozorenje i pusti
            notifyKP da radi za tebe.
          </p>
          <Link
            href="/registracija"
            className="mt-5 rounded-xl bg-sky-600 px-6 py-3 font-medium text-white transition hover:bg-sky-700"
          >
            Kreiraj nalog
          </Link>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} notifyKP
      </footer>
    </div>
  );
}
