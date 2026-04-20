import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/user.service";
import { listAlertsForUser } from "@/services/alert.service";
import { FREE_ALERT_LIMIT } from "@/services/plan";
import { CreateAlertForm } from "@/components/CreateAlertForm";

export default async function NewAlertPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const [profile, alerts] = await Promise.all([
    getProfile(supabase, user.id),
    listAlertsForUser(supabase, user.id),
  ]);

  const plan = profile?.plan ?? "free";
  if (plan === "free" && alerts.length >= FREE_ALERT_LIMIT) {
    redirect("/dashboard");
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-sky-600 hover:text-sky-800"
      >
        ← Nazad na tablu
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Novo upozorenje
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Worker će pretraživati po ključnoj reči i uporediti naslov, cenu i
        lokaciju oglasa.
      </p>
      <div className="mt-8">
        <CreateAlertForm />
      </div>
    </div>
  );
}
