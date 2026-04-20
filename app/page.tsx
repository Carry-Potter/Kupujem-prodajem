import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            notifyKP
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Budi obavešten čim se pojavi oglas koji tražiš
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Praviš upozorenja po ključnoj reči, ceni i lokaciji. Naš worker
            skenira rezultate pretrage, uparuje nove oglase i šalje ti poruku na
            Telegram.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/registracija"
              className="rounded-lg bg-sky-600 px-6 py-3 font-medium text-white shadow hover:bg-sky-700"
            >
              Započni besplatno
            </Link>
            <Link
              href="/prijava"
              className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-800 hover:bg-slate-50"
            >
              Prijava
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Upozorenja
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Besplatni plan: do 2 aktivna upozorenja. Pro: neograničeno i
              osvežavanje na ~5 minuta.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Skeniranje</h2>
            <p className="mt-2 text-sm text-slate-600">
              Pozadinski proces sa node-cron i Cheerio parsiranjem HTML-a.
              Selektore prilagodi stvarnoj stranici preko env promenljivih.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Telegram</h2>
            <p className="mt-2 text-sm text-slate-600">
              Inline dugmad za oglas i kontakt prodavca čim se desi meč koji
              ispunjava tvoje filtere.
            </p>
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} notifyKP
      </footer>
    </div>
  );
}
