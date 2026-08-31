/** Dashboard-only mock subscription (no payments). */
export const FREE_AGREEMENT_LIMIT = 3;

export type MockPlanId = "free" | "pro";

/** Legacy browser-wide key — caused new accounts to inherit Pro from testing. */
const LEGACY_STORAGE_KEY = "vstah_mock_subscription_plan";

function planStorageKey(userId?: string | null): string | null {
  const id = userId?.trim();
  if (!id) return null;
  return `vstah_mock_subscription_plan_${id}`;
}

/** Each provider account starts on Free unless they used the mock upgrade on this account. */
export function readMockPlan(userId?: string | null): MockPlanId {
  if (typeof window === "undefined") return "free";

  const key = planStorageKey(userId);
  if (!key) return "free";

  const stored = window.localStorage.getItem(key);
  if (stored === "pro" || stored === "free") return stored;

  // New account — do not inherit legacy browser-wide Pro from another session.
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
  return "free";
}

export function writeMockPlan(plan: MockPlanId, userId?: string | null): void {
  if (typeof window === "undefined") return;

  const key = planStorageKey(userId);
  if (!key) return;

  window.localStorage.setItem(key, plan);
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
