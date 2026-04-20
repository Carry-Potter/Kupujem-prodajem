/**
 * Uparivanje naslova oglasa sa ključnom reči upozorenja.
 * Izbegava previše strogo pravilno poklapanje (npr. "luster" vs "lustra").
 */

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeTitleText(s: string): string {
  return stripDiacritics(s.trim().toLowerCase());
}

function splitWords(s: string): string[] {
  return s
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length > 0);
}

/** Levenštajn za kratke reči (O(nm), nm su mali) */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[n]!;
}

function wordMatchesToken(kwToken: string, titleWord: string): boolean {
  if (!kwToken || !titleWord) return false;
  if (titleWord.includes(kwToken) || kwToken.includes(titleWord)) return true;
  if (kwToken.length <= 2) {
    return titleWord === kwToken;
  }
  const ml = Math.max(kwToken.length, titleWord.length);
  const maxDist = Math.min(3, Math.max(1, Math.floor(ml / 3)));
  return levenshtein(kwToken, titleWord) <= maxDist;
}

/**
 * Svaki „značajan” deo ključne reči mora da se poklopi sa naslovom:
 * - više reči: svaka (dužine ≥2) mora da nađe podudaranje (podstring ili bliska reč u naslovu)
 * - jedna reč: podstring ili blisko poklapanje sa nekom reči naslova
 */
export function titleMatchesKeyword(title: string, keyword: string): boolean {
  const t = normalizeTitleText(title);
  const raw = keyword.trim();
  if (!raw) return false;
  const k = normalizeTitleText(raw);
  if (!k) return false;
  if (t.includes(k)) return true;

  const parts = k.split(/\s+/).filter((p) => p.length > 0);
  const tokens = parts.length > 1 ? parts.filter((p) => p.length >= 2) : parts;

  if (tokens.length === 0) return false;

  const titleWords = splitWords(t);

  for (const tok of tokens) {
    if (t.includes(tok)) continue;
    const ok = titleWords.some((w) => wordMatchesToken(tok, w));
    if (!ok) return false;
  }

  return true;
}
