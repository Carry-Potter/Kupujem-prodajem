"use client";

import { useTransition, useState } from "react";
import { updateAlertAction } from "@/app/dashboard/actions";
import type { DbAlert } from "@/types/database";

export function EditAlertForm({ alert }: { alert: DbAlert }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mx-auto max-w-lg space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await updateAlertAction(alert.id, fd);
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
          Više reči: svaka mora u naslovu (ili i u tekstu oglasa ako je uključena
          opcija ispod). Bliske varijante (npr. „luster“ / „lustra“) pokušavaju se
          prepoznati.
        </p>
        <input
          required
          name="keyword"
          defaultValue={alert.keyword}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Stanje predmeta (KP filter)
        </label>
        <select
          name="kp_condition"
          defaultValue={alert.kp_condition ?? ""}
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
          id="search_in_description_edit"
          type="checkbox"
          name="search_in_description"
          defaultChecked={alert.search_in_description === true}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <label
          htmlFor="search_in_description_edit"
          className="text-sm text-slate-700"
        >
          <span className="font-medium">Pretraga po tekstu oglasa</span> — reči u
          kratkom tekstu oglasa i naslovu; lista na KP ide od najmanje cene.
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Maks. cena (EUR)
          </label>
          <input
            required
            type="number"
            min={1}
            step={1}
            name="max_price"
            defaultValue={Number(alert.max_price)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Min. cena u EUR (opciono)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            name="min_price"
            defaultValue={
              alert.min_price != null ? Number(alert.min_price) : ""
            }
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
          defaultValue={alert.cheapest_limit ?? 20}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value={10}>10 najjeftinijih</option>
          <option value={20}>20 najjeftinijih</option>
          <option value={50}>50 najjeftinijih</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Samo N najjeftinijih pogodaka iz skena; postojeći mečevi u listi se ne
          dupliraju.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Lokacija (opciono)
        </label>
        <input
          name="location"
          defaultValue={alert.location}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? "Čuvanje…" : "Ažuriraj"}
      </button>
    </form>
  );
}
