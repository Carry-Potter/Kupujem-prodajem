import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/services/user.service";
import { TelegramSettingsForm } from "@/components/TelegramSettingsForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prijava");

  const profile = await getProfile(supabase, user.id);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Podešavanja</h1>
      <p className="mt-1 text-sm text-slate-600">
        Email na nalogu:{" "}
        <span className="font-medium text-slate-800">{user.email}</span>
      </p>

      <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Telegram</h2>
        <p className="mt-2 text-sm text-slate-600">
          Poveži nalog preko bota (preporučeno) ili ručno unesi chat ID. Za link
          treba da u <code className="rounded bg-slate-100 px-1">.env.local</code>{" "}
          bude podešen{" "}
          <code className="rounded bg-slate-100 px-1">
            NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
          </code>{" "}
          (korisničko ime bota bez @).
        </p>
        <div className="mt-6">
          <TelegramSettingsForm
            initialChatId={profile?.telegram_chat_id ?? null}
          />
        </div>
      </section>
    </div>
  );
}
