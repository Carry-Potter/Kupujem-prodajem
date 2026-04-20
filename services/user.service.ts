import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbUser } from "@/types/database";

function mapUsersTableError(message: string): Error {
  if (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("does not exist")
  ) {
    return new Error(
      "Baza još nema tabele. U Supabase: SQL Editor → nalepi i pokreni ceo fajl supabase/schema.sql iz projekta, sačekaj minut i osveži stranicu."
    );
  }
  return new Error(message);
}

export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw mapUsersTableError(error.message);
  return data as DbUser | null;
}

export async function updateTelegramChatId(
  supabase: SupabaseClient,
  userId: string,
  telegramChatId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ telegram_chat_id: telegramChatId })
    .eq("id", userId);
  if (error) throw mapUsersTableError(error.message);
}
