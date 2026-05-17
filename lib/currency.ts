import type { Language } from "@/lib/i18n/locales";

/** Armenian dram — primary currency across VSTAH. */
export const AMD_SYMBOL = "֏";

/** Pro subscription price (AMD only). */
export const PRO_MONTHLY_AMD = 9_000;

const LOCALE_TAGS: Record<Language, string> = {
  en: "en-US",
  hy: "hy-AM",
  ru: "ru-RU"
};

export function formatAMD(
  value: number,
  options?: { maxFractionDigits?: number; language?: Language }
): string {
  const maxFractionDigits = options?.maxFractionDigits ?? 0;
  const locale = options?.language ? LOCALE_TAGS[options.language] : "en-US";
  return `${value.toLocaleString(locale, { maximumFractionDigits: maxFractionDigits })} ${AMD_SYMBOL}`;
}

/** Pro price in dram for every locale, e.g. `9,000 ֏ / month`. */
export function formatProMonthly(perMonthSuffix: string, language: Language = "en"): string {
  return `${formatAMD(PRO_MONTHLY_AMD, { language })} ${perMonthSuffix.trim()}`;
}
