"use client";

import { useTransition, useState } from "react";
import { createAlertAction } from "@/app/dashboard/actions";

export function CreateAlertForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await createAlertAction(fd);
          if (res && "error" in res) setError(res.error);
        });
      }}
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Ključna reč
        </label>
        <p className="mb-1 text-xs text-slate-500">
          Može i više reči (svaka mora da se pojavi u naslovu, a ako ispod uključiš
          pretragu po tekstu oglasa — i u tekstu oglasa). Bliske varijante (npr.
          „luster“ / „lustra“) se pokušavaju da se prepoznaju.
        </p>
        <input
          required
          name="keyword"
          placeholder="npr. PlayStation 5"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Stanje predmeta (KP filter)
        </label>
        <select
          name="kp_condition"
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">Bilo koje stanje</option>
          <option value="new">Novo</option>
          <option value="as-new">Nekorišćeno</option>
          <option value="used">Korišćeno</option>
          <option value="damaged">Neispravno / oštećeno</option>
        </select>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
        <input
          id="search_in_description"
          type="checkbox"
          name="search_in_description"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <label htmlFor="search_in_description" className="text-sm text-slate-700">
          <span className="font-medium">Pretraga po tekstu oglasa</span> — na KP
          se uključuje „pretraži i u opisu“, a reči se traže i u kratkom tekstu
          oglasa pored naslova. Rezultati se i dalje biraju{" "}
          <strong>od najmanje cene naviše</strong>.
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Maks. cena (EUR)
          </label>
          <p className="mb-1 text-xs text-slate-500">
            Gornja granica (na KP kao <strong>priceTo</strong>). Mora biti{" "}
            <strong>veća</strong> od minimalne i od tipičnih cena koje tražiš.
          </p>
          <input
            required
            type="number"
            min={1}
            step={1}
            name="max_price"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Min. cena u EUR (opciono)
          </label>
          <p className="mb-1 text-xs text-slate-500">
            Donja granica (na KP kao <strong>priceFrom</strong>). Npr. ako na sajtu
            filtriraš „od 1000 €”, ovde unesi 1000.
          </p>
          <input
            type="number"
            min={0}
            step={1}
            name="min_price"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Najjeftinijih oglasa po skeniranju
        </label>
        <select
          name="cheapest_limit"
          defaultValue={20}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value={10}>10 najjeftinijih</option>
          <option value={20}>20 najjeftinijih</option>
          <option value={50}>50 najjeftinijih</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Od rezultata pretrage koji odgovaraju kriterijumima, prate se samo N
          najjeftinijih — novi mečevi se dodaju bez dupliranja već sačuvanih
          parova.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Lokacija (opciono)
        </label>
        <input
          name="location"
          placeholder="npr. Beograd — prazno znači bilo koja lokacija"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Ako uneseš tekst, uparivanje je bez razlike malih/velikih slova i traži
          podstring u polju lokacije oglasa. Posle čuvanja server pokreće KP sken
          u pozadini (potreban je{" "}
          <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          u <code className="rounded bg-slate-100 px-1">.env.local</code>), pa
          čuvanje više ne čeka kompletno skeniranje.
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? "Čuvanje…" : "Sačuvaj upozorenje"}
      </button>
    </form>
  );
}
