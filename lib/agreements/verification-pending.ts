/**
 * Demo/local store: indexes awaiting admin payment verification.
 * `-1` = single/total payment; `>= 0` = milestone index.
 */

const KEY = "vstah_verification_pending";

type Store = Record<string, number[]>;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== "object") return {};
    const next: Store = {};
    for (const [id, indexes] of Object.entries(parsed)) {
      if (!Array.isArray(indexes)) continue;
      next[id] = indexes
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && (n === -1 || n >= 0));
    }
    return next;
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function getVerificationPendingIndexes(agreementId: string): number[] {
  return [...(readStore()[agreementId] ?? [])];
}

export function setVerificationPendingIndexes(agreementId: string, indexes: number[]) {
  const store = readStore();
  const unique = [...new Set(indexes.filter((n) => Number.isFinite(n) && (n === -1 || n >= 0)))];
  if (unique.length === 0) {
    delete store[agreementId];
  } else {
    store[agreementId] = unique;
  }
  writeStore(store);
}

export function addVerificationPendingIndex(agreementId: string, index: number) {
  const current = getVerificationPendingIndexes(agreementId);
  if (!current.includes(index)) current.push(index);
  setVerificationPendingIndexes(agreementId, current);
}

export function removeVerificationPendingIndex(agreementId: string, index: number) {
  setVerificationPendingIndexes(
    agreementId,
    getVerificationPendingIndexes(agreementId).filter((i) => i !== index)
  );
}

export function clearVerificationPending(agreementId: string) {
  const store = readStore();
  if (!(agreementId in store)) return;
  delete store[agreementId];
  writeStore(store);
}

export function hasVerificationPending(agreementId: string, index?: number): boolean {
  const indexes = getVerificationPendingIndexes(agreementId);
  if (index === undefined) return indexes.length > 0;
  return indexes.includes(index);
}

/** Agreement IDs that still have at least one pending verification. */
export function listVerificationPendingAgreementIds(): string[] {
  return Object.entries(readStore())
    .filter(([, indexes]) => indexes.length > 0)
    .map(([id]) => id);
}
