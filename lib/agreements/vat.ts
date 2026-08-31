export type VatMode = "included" | "exempt";

const VAT_MODE_TERMS_SUFFIX = /\n\n---\nvstah-vat-mode:\s*(included|exempt)\s*$/i;

export function normalizeVatMode(raw: unknown): VatMode {
  return raw === "exempt" ? "exempt" : "included";
}

/** Persist exempt mode in contract text when the DB column is missing or defaulted. */
export function appendVatModeToTerms(customTerms: string, mode: VatMode): string {
  const base = stripVatModeFromTerms(customTerms);
  if (mode !== "exempt") return base;
  return `${base}\n\n---\nvstah-vat-mode: exempt`;
}

export function stripVatModeFromTerms(customTerms: string): string {
  return customTerms.replace(VAT_MODE_TERMS_SUFFIX, "").trimEnd();
}

export function parseVatModeFromTerms(customTerms: string): VatMode | null {
  const match = customTerms.match(VAT_MODE_TERMS_SUFFIX);
  if (!match?.[1]) return null;
  return match[1].toLowerCase() === "exempt" ? "exempt" : "included";
}

export function resolveVatMode(dbValue: unknown, customTerms?: string | null): VatMode {
  const fromTerms = customTerms ? parseVatModeFromTerms(customTerms) : null;
  if (fromTerms === "exempt") return "exempt";
  return normalizeVatMode(dbValue);
}

export function vatStatusLine(
  mode: VatMode,
  labels: { included: string; exempt: string }
): string {
  return mode === "exempt" ? labels.exempt : labels.included;
}
