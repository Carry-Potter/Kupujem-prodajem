/**
 * Parsira cenu iz teksta oglasa (KP u EUR: "250 €", "1.250 €", "1.250,50 €";
 * starije: "7.500 din", "1200 RSD").
 */
export function parsePriceFromText(raw: string | undefined | null): number | null {
  if (!raw) return null;

  let s = raw
    .replace(/\s/g, "")
    .replace(/€|eur/gi, "")
    .replace(/din\.?|rsd|r\.?d\.?/gi, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // EU: 1.250,50 (hiljade.tačka, decimalni zarez)
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma && !hasDot) {
    // 1250,50 ili 250,5
    s = s.replace(",", ".");
  } else if (hasDot && !hasComma) {
    const parts = s.split(".");
    if (parts.length === 2 && parts[1].length === 3 && /^\d+$/.test(parts[1])) {
      // 1.250 ili 7.500 – tri decimale → verovatno hiljade (RSD/EUR format)
      s = parts[0] + parts[1];
    } else if (parts.length > 2) {
      s = s.replace(/\./g, "");
    }
    // inače ostavi npr. 12.5 kao decimalno
  }

  const num = parseFloat(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : null;
}
