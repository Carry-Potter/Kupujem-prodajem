import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link href="/prijava" className="hover:text-slate-900">
            Prijava
          </Link>
          <Link
            href="/registracija"
            className="rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
          >
            Registracija
          </Link>
        </nav>
      </div>
    </header>
  );
}
