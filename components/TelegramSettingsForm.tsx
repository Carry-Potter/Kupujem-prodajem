"use client";

import { useTransition, useState } from "react";
import { saveTelegramAction } from "@/app/dashboard/actions";

type Props = { initialChatId: string | null };

export function TelegramSettingsForm({ initialChatId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const [connectPending, setConnectPending] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  async function handleConnectTelegram() {
    setConnectError(null);
    setConnectUrl(null);
    setConnectPending(true);
    try {
      const res = await fetch("/api/telegram/connect", {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        connectUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        setConnectError(body.error ?? "Zahtev nije uspeo.");
        return;
      }
      if (!body.connectUrl) {
        setConnectError("Nedostaje link za bota.");
        return;
      }
      setConnectUrl(body.connectUrl);
    } catch {
      setConnectError("Mrežna greška. Pokušaj ponovo.");
    } finally {
      setConnectPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Poveži Telegram (preporučeno)
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Generiši link, otvori ga u Telegramu i pritisni Start. Ne moraš ručno da
          tražiš chat ID.
        </p>
        {connectError && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {connectError}
          </p>
        )}
        {connectUrl && (
          <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
            <p className="font-medium text-sky-900">Korak: otvori bota</p>
            <a
              href={connectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block break-all font-mono text-sky-700 underline"
            >
              {connectUrl}
            </a>
            <p className="mt-2 text-xs text-sky-800">
              Posle uspešnog Start-a osveži stranicu — videćeš sačuvan chat ID
              ispod ako želiš da proveriš.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => void handleConnectTelegram()}
          disabled={connectPending}
          className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {connectPending ? "Generišem link…" : "Poveži Telegram"}
        </button>
      </div>

      <form
        className="space-y-4 border-t border-slate-200 pt-8"
        action={(fd) => {
          setError(null);
          setOk(false);
          startTransition(async () => {
            const res = await saveTelegramAction(fd);
            if (res && "error" in res && res.error) setError(res.error);
            else if (res?.ok) setOk(true);
          });
        }}
      >
        <h3 className="text-sm font-semibold text-slate-900">
          Ručno: Telegram chat ID
        </h3>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Sačuvano.
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Chat ID
          </label>
          <input
            name="telegram_chat_id"
            defaultValue={initialChatId ?? ""}
            placeholder="npr. 123456789"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            Alternativa: @userinfobot ili slično. Ostavi prazno da obrišeš
            povezivanje.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "Čuvanje…" : "Sačuvaj chat ID"}
        </button>
      </form>
    </div>
  );
}
