import * as cheerio from "cheerio";
import { parsePriceFromText } from "@/lib/utils/price";
import type { DbAlert } from "@/types/database";

function dedupeListingsByExternalId(listings: ParsedListing[]): ParsedListing[] {
  const map = new Map<string, ParsedListing>();
  for (const l of listings) {
    if (!map.has(l.externalId)) map.set(l.externalId, l);
  }
  return Array.from(map.values());
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function setPageOnSearchUrl(urlString: string, page: number): string {
  try {
    const u = new URL(urlString);
    u.searchParams.set("page", String(page));
    return u.toString();
  } catch {
    if (/[?&]page=/i.test(urlString)) {
      return urlString.replace(/([?&])page=\d+/i, `$1page=${page}`);
    }
    const sep = urlString.includes("?") ? "&" : "?";
    return `${urlString}${sep}page=${page}`;
  }
}

export type ParsedListing = {
  externalId: string;
  title: string;
  price: number | null;
  location: string | null;
  url: string;
  imageUrl: string | null;
  /** Kratak opis sa kartice (za pretragu po tekstu oglasa) */
  descriptionSnippet: string | null;
};

export type ScraperSelectors = {
  listingSelector: string;
  titleSel: string;
  priceSel: string;
  locationSel: string;
  linkSel: string;
  /** Prva slika oglasa (opciono; inače prvi smislen img u članku) */
  imageSel?: string;
  /** Opcioni atribut za ID na samom kontejneru */
  idAttr?: string;
  /** Prvi red opisa / snippeta ispod naslova */
  descriptionSnippetSel?: string;
};

/** Podrazumevano za KupujemProdajem (React): prvi link na oglas često vodi na sliku bez teksta. */
const DEFAULT_SELECTORS: ScraperSelectors = {
  listingSelector: "article[class*='AdItem_adHolder'], article[class*='AdItem']",
  titleSel: "[class*='AdItem_name'], h2 a, h3 a",
  priceSel: "[class*='AdItem_price'], [class*='price']",
  locationSel: "[class*='originAndPromoLocation'] p, [class*='location']",
  linkSel: "[class*='AdItem_descriptionHolder'] a[href*='/oglas/']",
  imageSel:
    "[class*='AdItem_photo'] img, [class*='photo'] img, picture img, img[src]",
  descriptionSnippetSel:
    "[class*='AdItem_descriptionHolder'] p, [class*='AdItem_description'] p",
};

function loadSelectors(): ScraperSelectors {
  const raw = process.env.KP_SCRAPER_SELECTORS;
  if (!raw) return DEFAULT_SELECTORS;
  try {
    return { ...DEFAULT_SELECTORS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SELECTORS;
  }
}

function absolutize(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function deriveIdFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i];
    }
    return u.pathname.replace(/[^\w-]+/g, "_").slice(0, 200) || u.href;
  } catch {
    return url.slice(0, 120);
  }
}

/**
 * Učitava HTML rezultata pretrage i vraća listu oglasa.
 * Selektore prilagodite stvarnom DOM-u (env KP_SCRAPER_SELECTORS).
 */
export async function scrapeListingsFromSearchUrl(
  searchUrl: string
): Promise<ParsedListing[]> {
  console.info(`[notifyKP] KP fetch: ${searchUrl}`);
  const ua =
    process.env.SCRAPER_USER_AGENT ||
    "notifyKP/1.0 (+https://github.com/notifykp)";
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": ua,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "sr-RS,sr;q=0.9,en;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} za ${searchUrl}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const sel = loadSelectors();
  const base = new URL(searchUrl).origin;
  const out: ParsedListing[] = [];

  $(sel.listingSelector).each((_, el) => {
    const block = $(el);

    // KP: prvi <a .../oglas/...> u članku često vodi na sliku; kanoničan tekst link je u descriptionHolder-u.
    let href =
      block.find(sel.linkSel).first().attr("href") ||
      block.find('a[href*="/oglas/"]').eq(1).attr("href") ||
      block.find('a[href*="/oglas/"]').last().attr("href") ||
      "";

    if (!href) return;

    const url = absolutize(href, base);
    let externalId =
      (sel.idAttr && block.attr(sel.idAttr)) || deriveIdFromUrl(url);
    externalId = String(externalId).replace(/\s/g, "");

    const title =
      block.find(sel.titleSel).first().text().trim() ||
      block.find("[class*='AdItem_name']").first().text().trim() ||
      block.find("img[alt]").first().attr("alt")?.trim() ||
      block
        .find('a[href*="/oglas/"][aria-label]')
        .filter((_, node) => {
          const lab = $(node).attr("aria-label");
          return Boolean(lab && lab !== "link");
        })
        .first()
        .attr("aria-label")
        ?.trim() ||
      "";

    if (!title) return;

    const priceRaw = block.find(sel.priceSel).first().text();
    const locRaw = block.find(sel.locationSel).first().text();

    const snippetSel =
      sel.descriptionSnippetSel ?? DEFAULT_SELECTORS.descriptionSnippetSel;
    let descriptionSnippet: string | null = null;
    if (snippetSel) {
      const raw = block.find(snippetSel).first().text().trim();
      descriptionSnippet = raw.length > 0 ? raw : null;
    }

    /** Glavna slika je u holderu (AdItem_imageHolder) + KP CDN. */
    const holderImgs = block
      .find("[class*='AdItem_imageHolder'] img[src]")
      .toArray();
    const kpPhotoImgs = block
      .find(
        'img[src*="images.kupujemprodajem.com"], img[src*="/photos/oglasi/"]'
      )
      .toArray();
    const imgCandidates = sel.imageSel
      ? block.find(sel.imageSel).toArray()
      : [];
    const fallbackImgs = block.find("img[src]").toArray();
    let rawImg: string | undefined;
    for (const node of [
      ...holderImgs,
      ...kpPhotoImgs,
      ...imgCandidates,
      ...fallbackImgs,
    ]) {
      const s = $(node).attr("src")?.trim();
      if (
        s &&
        !s.startsWith("data:") &&
        s.length > 8 &&
        !/sprite|logo|icon|placeholder/i.test(s)
      ) {
        rawImg = s;
        break;
      }
    }
    const imageUrl = rawImg ? absolutize(rawImg, base) : null;

    out.push({
      externalId,
      title,
      price: parsePriceFromText(priceRaw),
      location: locRaw?.trim() || null,
      url,
      imageUrl,
      descriptionSnippet,
    });
  });

  console.info(`[notifyKP] KP parsed listings: ${out.length}`);
  return out;
}

export type BuildSearchUrlOptions = { page?: number };

const KP_CONDITION_PARAM = new Set(["new", "as-new", "used", "damaged"]);

/**
 * KP: uvek sort rastuće po ceni (najjeftinije prvo), opciono stanje + pretraga u opisu.
 */
function applyKpAlertFiltersToUrl(
  urlString: string,
  alert: Partial<Pick<DbAlert, "kp_condition" | "search_in_description">>
): string {
  try {
    const u = new URL(urlString);
    u.searchParams.set("orderDirection", "asc");
    u.searchParams.delete("order");
    const c = alert.kp_condition?.trim();
    if (c && KP_CONDITION_PARAM.has(c)) {
      u.searchParams.set("condition", c);
    } else {
      u.searchParams.delete("condition");
    }
    if (alert.search_in_description) {
      u.searchParams.set("descriptionSearch", "1");
    } else {
      u.searchParams.delete("descriptionSearch");
    }
    return u.toString();
  } catch {
    let s = urlString;
    if (!/[?&]orderDirection=/.test(s)) {
      s += (s.includes("?") ? "&" : "?") + "orderDirection=asc";
    }
    s = s.replace(/[&?]order=[^&]*/g, "").replace(/\?&/g, "?");
    const c = alert.kp_condition?.trim();
    if (c && KP_CONDITION_PARAM.has(c) && !/[?&]condition=/.test(s)) {
      s += (s.includes("?") ? "&" : "?") + `condition=${encodeURIComponent(c)}`;
    }
    if (alert.search_in_description && !/[?&]descriptionSearch=/.test(s)) {
      s += (s.includes("?") ? "&" : "?") + "descriptionSearch=1";
    }
    return s;
  }
}

/**
 * Isti oblik kao na KP pretrazi: keywords, EUR, sort, opciono priceFrom / priceTo.
 * @see https://www.kupujemprodajem.com/pretraga (filteri cene)
 */
export function buildSearchUrlForAlert(
  alert: Pick<DbAlert, "keyword"> &
    Partial<
      Pick<
        DbAlert,
        "min_price" | "max_price" | "kp_condition" | "search_in_description"
      >
    >,
  options?: BuildSearchUrlOptions
): string {
  const kw = alert.keyword.trim();
  const page =
    options?.page != null && options.page > 0
      ? Math.floor(options.page)
      : 1;
  const tpl = process.env.KP_SEARCH_URL_TEMPLATE;
  let url: string;
  if (tpl) {
    url = tpl.replace("{keyword}", encodeURIComponent(kw));
  } else {
    url = [
      "https://www.kupujemprodajem.com/pretraga",
      "?keywords=" + encodeURIComponent(kw),
      "&ignoreUserId=no",
      "&orderDirection=asc",
      "&page=1",
      "&currency=eur",
    ].join("");
  }

  const minV = alert.min_price != null ? Number(alert.min_price) : null;
  const maxV = alert.max_price != null ? Number(alert.max_price) : null;

  if (minV != null && Number.isFinite(minV) && minV > 0 && !url.includes("priceFrom=")) {
    url += `&priceFrom=${Math.floor(minV)}`;
  }
  if (maxV != null && Number.isFinite(maxV) && maxV > 0 && !url.includes("priceTo=")) {
    url += `&priceTo=${Math.ceil(maxV)}`;
  }

  const filterId = process.env.KP_SEARCH_FILTER_ID?.trim();
  if (filterId && !url.includes("filterId=")) {
    const sep = url.includes("?") ? "&" : "?";
    url += `${sep}filterId=${encodeURIComponent(filterId)}`;
  }

  url = applyKpAlertFiltersToUrl(url, alert);
  return setPageOnSearchUrl(url, page);
}

/**
 * Više stranica rezultata (podrazumevano 2) da ne bi sve zavisilo od prve stranice.
 * Broj stranica: env KP_SEARCH_MAX_PAGE (1–10), podrazumevano 2.
 */
export async function scrapeListingsForAlert(
  alert: Pick<
    DbAlert,
    | "keyword"
    | "min_price"
    | "max_price"
    | "kp_condition"
    | "search_in_description"
  >
): Promise<ParsedListing[]> {
  let maxPage = parseInt(process.env.KP_SEARCH_MAX_PAGE ?? "2", 10);
  if (!Number.isFinite(maxPage)) maxPage = 2;
  maxPage = clampInt(maxPage, 1, 10);
  const merged: ParsedListing[] = [];
  for (let p = 1; p <= maxPage; p++) {
    const url = buildSearchUrlForAlert(alert, { page: p });
    const part = await scrapeListingsFromSearchUrl(url);
    console.info(`[notifyKP] KP page=${p} listings=${part.length}`);
    merged.push(...part);
  }
  const deduped = dedupeListingsByExternalId(merged);
  console.info(
    `[notifyKP] KP total listings=${merged.length}, deduped=${deduped.length}`
  );
  return deduped;
}

/** Samo ključna reč (testovi / jednostavni pozivi) – bez priceFrom/priceTo. */
export function buildSearchUrlForKeyword(keyword: string): string {
  return buildSearchUrlForAlert({ keyword });
}
