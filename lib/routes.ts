/** Canonical app routes (clean URLs — no route-group prefixes). */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  settings: "/settings"
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Build `/login` or `/register` with an optional post-auth redirect. */
export function authPath(path: typeof ROUTES.login | typeof ROUTES.register, next?: string): string {
  if (!next || next === path) return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

export const LOGIN_FOR_DASHBOARD = authPath(ROUTES.login, ROUTES.dashboard);
export const LOGIN_FOR_SETTINGS = authPath(ROUTES.login, ROUTES.settings);
export const REGISTER_FOR_DASHBOARD = authPath(ROUTES.register, ROUTES.dashboard);

/** Resolve a safe in-app redirect target from a `?next=` query param. */
export function sanitizeNextRoute(next: string | null | undefined, fallback: string = ROUTES.dashboard): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function loginUrl(next: string = ROUTES.dashboard): string {
  return authPath(ROUTES.login, next);
}

export function registerUrl(next: string = ROUTES.dashboard): string {
  return authPath(ROUTES.register, next);
}
