import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">Prijava</h1>
          <p className="mt-1 text-sm text-slate-600">
            Google nalog ili email i lozinka.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-center text-slate-500">Učitavanje…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
