"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMatchArchivedAction } from "@/app/dashboard/actions";

type Props = {
  matchId: string;
  /** Iz aktivnog prikaza u istoriju */
  variant: "to-history" | "restore";
};

export function MatchHistoryActions({ matchId, variant }: Props) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const archived = variant === "to-history";

  return (
    <div className="flex w-full flex-col items-end gap-1 sm:w-auto">
      {err && (
        <p className="max-w-[14rem] text-right text-xs text-red-600">{err}</p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setErr(null);
          startTransition(async () => {
            const res = await setMatchArchivedAction(matchId, archived);
            if (res && "error" in res) {
              setErr(res.error);
              return;
            }
            router.refresh();
          });
        }}
        className={`inline-flex justify-center rounded-lg border px-3 py-2 text-sm font-medium ${
          archived
            ? "border-slate-300 text-slate-700 hover:bg-slate-50"
            : "border-sky-200 text-sky-800 hover:bg-sky-50"
        } disabled:opacity-60`}
      >
        {pending
          ? "…"
          : archived
            ? "Prebaci u istoriju"
            : "Vrati u aktivni prikaz"}
      </button>
    </div>
  );
}
