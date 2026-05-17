/** Dashboard-only mock subscription (no payments). */
export const FREE_AGREEMENT_LIMIT = 3;

export type MockPlanId = "free" | "pro";

const STORAGE_KEY = "vstah_mock_subscription_plan";

export function readMockPlan(): MockPlanId {
  if (typeof window === "undefined") return "free";
  return window.localStorage.getItem(STORAGE_KEY) === "pro" ? "pro" : "free";
}

export function writeMockPlan(plan: MockPlanId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, plan);
}
