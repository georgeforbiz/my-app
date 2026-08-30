import type { Language } from "@/lib/i18n/locales";

/** Armenian dram — primary currency across VSTAH. */
export const AMD_SYMBOL = "֏";

/** Pro subscription price (AMD only). */
export const PRO_MONTHLY_AMD = 15_000;

/** Stable locale so SSR and browser render the same grouping (avoids hydration mismatch). */
const NUMBER_FORMAT_LOCALE = "en-US";

export function formatAMD(
  value: number,
  options?: { maxFractionDigits?: number; language?: Language }
): string {
  const maxFractionDigits = options?.maxFractionDigits ?? 0;
  return `${value.toLocaleString(NUMBER_FORMAT_LOCALE, { maximumFractionDigits: maxFractionDigits })} ${AMD_SYMBOL}`;
}

/** Pro price in dram for every locale, e.g. `15,000 ֏ / month`. */
export function formatProMonthly(perMonthSuffix: string, language: Language = "en"): string {
  return `${formatAMD(PRO_MONTHLY_AMD, { language })} ${perMonthSuffix.trim()}`;
}

/**
 * Format a currency text field while typing: `2000000` → `2,000,000`.
 * Keeps an optional decimal part (max 2 digits).
 */
export function formatGroupedNumberInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const firstDot = cleaned.indexOf(".");
  const intRaw = firstDot === -1 ? cleaned : cleaned.slice(0, firstDot);
  const decRaw = firstDot === -1 ? null : cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);

  // Drop leading zeros except a single zero before a decimal.
  const intNormalized = intRaw.replace(/^0+(?=\d)/, "") || (decRaw !== null ? "0" : intRaw ? "0" : "");
  const intGrouped = intNormalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (decRaw !== null) {
    return `${intGrouped}.${decRaw}`;
  }
  return intGrouped;
}

/** Parse a grouped currency input (`2,000,000.50`) to a number. */
export function parseGroupedNumberInput(raw: string): number {
  const normalized = raw.replace(/,/g, "").replace(/[^0-9.]/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
