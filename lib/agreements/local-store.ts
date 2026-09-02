/**
 * Browser-local agreement store used when Supabase is unreachable (or the
 * session came from mock auth). Mirrors `lib/auth/mock-storage.ts`.
 */

import { mapMilestoneFromStorage, type Milestone, type NormalizedAgreement } from "./row";

const KEY = "vstah_local_agreements";
const LOCAL_ID_PREFIX = "local-";

export function isLocalAgreementId(id: string | undefined | null): boolean {
  return typeof id === "string" && id.startsWith(LOCAL_ID_PREFIX);
}

export function createLocalAgreementId(): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${LOCAL_ID_PREFIX}${suffix}`;
}

/** Milestones must always carry a status; deposit/release actions key off it. */
function withMilestoneStatuses(agreement: NormalizedAgreement): NormalizedAgreement {
  if (!Array.isArray(agreement.milestones)) return agreement;
  return {
    ...agreement,
    milestones: agreement.milestones.map((m): Milestone => mapMilestoneFromStorage(m))
  };
}

function readAll(): NormalizedAgreement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as NormalizedAgreement[];
    return Array.isArray(parsed) ? parsed.map(withMilestoneStatuses) : [];
  } catch {
    return [];
  }
}

function writeAll(list: NormalizedAgreement[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full / disabled — nothing else we can do client-side.
  }
}

/** Local agreements for the signed-in provider only. */
export function listLocalAgreementsForDashboard(currentProviderId?: string): NormalizedAgreement[] {
  const all = readAll();
  if (!currentProviderId) return [];
  return all
    .filter((row) => row.provider_id === currentProviderId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/** Newest first, optionally limited to one provider. */
export function listLocalAgreements(providerId?: string): NormalizedAgreement[] {
  const all = readAll();
  const scoped = providerId ? all.filter((a) => a.provider_id === providerId) : all;
  return [...scoped].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getLocalAgreement(id: string): NormalizedAgreement | null {
  return readAll().find((a) => a.id === id) ?? null;
}

export function saveLocalAgreement(
  agreement: Omit<NormalizedAgreement, "id" | "created_at"> & { id?: string; created_at?: string }
): NormalizedAgreement {
  const record = withMilestoneStatuses({
    ...agreement,
    id: agreement.id ?? createLocalAgreementId(),
    created_at: agreement.created_at ?? new Date().toISOString()
  });
  const all = readAll().filter((a) => a.id !== record.id);
  writeAll([record, ...all]);
  return record;
}

export function updateLocalAgreement(
  id: string,
  patch: Partial<NormalizedAgreement>
): NormalizedAgreement | null {
  const all = readAll();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const next = withMilestoneStatuses({ ...all[index], ...patch });
  all[index] = next;
  writeAll(all);
  return next;
}

/** After publishing a browser-only agreement to Supabase, swap the local id for the cloud id. */
export function replaceLocalAgreementId(oldId: string, newId: string): NormalizedAgreement | null {
  const all = readAll();
  const index = all.findIndex((a) => a.id === oldId);
  if (index === -1) return null;
  const next = withMilestoneStatuses({ ...all[index], id: newId });
  const rest = all.filter((a) => a.id !== oldId && a.id !== newId);
  writeAll([next, ...rest]);
  return next;
}

/** Remove all browser-local agreements owned by the departing provider. */
export function clearLocalAgreementsForProvider(providerId: string): void {
  if (!providerId || typeof window === "undefined") return;
  const all = readAll();
  const next = all.filter((row) => row.provider_id !== providerId);
  if (next.length !== all.length) writeAll(next);
}
