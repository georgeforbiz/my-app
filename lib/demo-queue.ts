/**
 * Dev/demo: append prepared payloads locally until a real API exists.
 */

const KEY = "vstah_pending_db_writes";

export function enqueueDbPayload(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    arr.push(payload);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    console.warn("enqueueDbPayload failed");
  }
}
