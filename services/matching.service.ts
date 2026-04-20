import type { DbAd, DbAlert } from "@/types/database";
import { parsePriceFromText } from "@/lib/utils/price";
import {
  normalizeTitleText,
  titleMatchesKeyword,
} from "@/lib/utils/title-match";

function norm(s: string): string {
  return normalizeTitleText(s);
}

function keywordMatchesListingText(
  alert: DbAlert,
  title: string,
  descriptionSnippet?: string | null
): boolean {
  if (titleMatchesKeyword(title, alert.keyword)) return true;
  if (alert.search_in_description === true) {
    const snip = (descriptionSnippet ?? "").trim();
    if (snip.length > 0 && titleMatchesKeyword(snip, alert.keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * Da li oglas zadovoljava uslove upozorenja (bez upisa u bazu).
 */
export function listingMatchesAlert(alert: DbAlert, ad: DbAd): boolean {
  if (!keywordMatchesListingText(alert, ad.title, ad.description_snippet)) {
    return false;
  }

  const price = ad.price;
  if (price == null) return false;
  if (price > Number(alert.max_price)) return false;
  if (alert.min_price != null && price < Number(alert.min_price)) return false;

  const locAlert = alert.location.trim();
  if (locAlert.length === 0) return true;
  const locAd = ad.location?.trim() ?? "";
  const a = norm(locAlert);
  const b = norm(locAd);
  return b.includes(a) || a.includes(b);
}

/** Za parsiranje iz „sirovog” oglasa pre čuvanja */
export function listingMatchesAlertRaw(
  alert: DbAlert,
  partial: {
    title: string;
    price: number | null;
    location: string | null;
    description_snippet?: string | null;
  }
): boolean {
  const ad: DbAd = {
    id: "",
    title: partial.title,
    price: partial.price,
    location: partial.location,
    url: "",
    image_url: null,
    description_snippet: partial.description_snippet ?? null,
    created_at: "",
  };
  return listingMatchesAlert(alert, ad);
}

export { parsePriceFromText };
