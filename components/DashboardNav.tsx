import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOutAction } from "@/app/dashboard/actions";

export function DashboardNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Logo />
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
          <Link href="/dashboard" className="hover:text-slate-900">
            Kontrolna tabla
          </Link>
          <Link
            href="/dashboard/upozorenja/nova"
            className="hover:text-slate-900"
          >
            Novo upozorenje
          </Link>
          <Link href="/dashboard/oglasi" className="hover:text-slate-900">
            Pronađeni oglasi
          </Link>
          <Link href="/dashboard/podesavanja" className="hover:text-slate-900">
            Podešavanja
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Odjava
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
