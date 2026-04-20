export type Plan = "free" | "pro";

/** Vrednosti filtera „Stanje“ na KP (URL parametar condition=) */
export type KpCondition = "new" | "as-new" | "used" | "damaged";

export interface DbUser {
  id: string;
  email: string;
  plan: Plan;
  telegram_chat_id: string | null;
  /** Jednokratni token za t.me/bot?start=… dok korisnik ne završi /start u bota */
  telegram_connect_token?: string | null;
  created_at: string;
}

export interface DbAlert {
  id: string;
  user_id: string;
  keyword: string;
  max_price: number;
  min_price: number | null;
  location: string;
  is_active: boolean;
  last_scraped_at: string | null;
  /** Broj najjeftinijih pogodaka koji se prate po skeniranju (10 / 20 / 50). */
  cheapest_limit?: number;
  /** KP filter stanja; null = bilo koje */
  kp_condition?: KpCondition | null;
  /** KP „Pretraži i u tekstu oglasa“ + uparivanje i po snippetu */
  search_in_description?: boolean;
  created_at: string;
}

export interface DbAd {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  url: string;
  image_url: string | null;
  /** Kratak tekst sa liste rezultata (za pretragu po tekstu oglasa) */
  description_snippet?: string | null;
  created_at: string;
}

export interface DbMatch {
  id: string;
  alert_id: string;
  ad_id: string;
  sent: boolean;
  created_at: string;
}

/** Meč sa ugnježdenim upozorenjem i oglasom (lista za dashboard) */
export type MatchWithDetails = {
  id: string;
  created_at: string;
  sent: boolean;
  /** Korisnik je prebacio u „Sva istorija”; ne prikazuje se u „Aktivna upozorenja”. */
  archived_to_history?: boolean;
  alert: {
    id: string;
    keyword: string;
    is_active: boolean;
  } | null;
  ad: DbAd | null;
};

export type AlertInput = {
  keyword: string;
  max_price: number;
  min_price?: number | null;
  location: string;
  is_active?: boolean;
  /** 10, 20 ili 50 — samo najjeftiniji mečevi u okviru skena. */
  cheapest_limit?: number;
  kp_condition?: KpCondition | null;
  search_in_description?: boolean;
};
