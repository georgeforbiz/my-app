/** Calendar date as DD/MM/YYYY (e.g. `15/09/2026`). Accepts ISO `YYYY-MM-DD` without timezone shift. */
export function formatDateDMY(value: string | number | Date): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) {
      return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
    }
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Fix legacy contract text that embedded ISO dates in custom terms. */
export function formatEmbeddedDatesInTerms(terms: string): string {
  return terms
    .replace(
      /(ESTIMATED COMPLETION DATE:\s*)(\d{4}-\d{2}-\d{2})/gi,
      (_, label: string, iso: string) => `${label}${formatDateDMY(iso)}`
    )
    .replace(
      /(OFFER DEADLINE:\s*)(\d{4}-\d{2}-\d{2})/gi,
      (_, label: string, iso: string) => `${label}${formatDateDMY(iso)}`
    );
}
