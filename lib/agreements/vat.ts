export type VatMode = "included" | "exempt";

export function normalizeVatMode(raw: unknown): VatMode {
  return raw === "exempt" ? "exempt" : "included";
}

export function vatStatusLine(
  mode: VatMode,
  labels: { included: string; exempt: string }
): string {
  return mode === "exempt" ? labels.exempt : labels.included;
}
