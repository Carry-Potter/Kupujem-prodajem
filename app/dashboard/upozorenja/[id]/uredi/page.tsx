import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAlertById } from "@/services/alert.service";
import { EditAlertForm } from "@/components/EditAlertForm";

type Props = { params: { id: string } };

export default async function EditAlertPage({ params }: Props) {
  const { id } = params;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const alert = await getAlertById(supabase, user.id, id);
  if (!alert) notFound();

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm font-medium text-sky-600 hover:text-sky-800"
      >
        ← Nazad na tablu
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Izmeni upozorenje
      </h1>
      <div className="mt-8">
        <EditAlertForm alert={alert} />
      </div>
    </div>
  );
}
