import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <Link href="/">
            <Logo />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Registracija
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Google ili email — zatim dodaj upozorenja za oglase.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
