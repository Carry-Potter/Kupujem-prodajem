"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: origin
        ? { emailRedirectTo: `${origin}/auth/callback` }
        : undefined,
    });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    setInfo(
      "Poslali smo ti link za potvrdu na email. Posle potvrde možeš da se prijaviš."
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <GoogleSignInButton nextPath="/dashboard" />
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-slate-500">ili sa emailom</span>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {info}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Lozinka (min. 6 karaktera)
        </label>
        <input
          required
          type="password"
          name="password"
          minLength={6}
          autoComplete="new-password"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-2.5 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {pending ? "Slanje…" : "Registruj se"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Već imaš nalog?{" "}
        <Link href="/prijava" className="font-medium text-sky-600">
          Prijava
        </Link>
      </p>
      </form>
    </div>
  );
}
