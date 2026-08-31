"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject
} from "react";
import { humanizeAuthError, isAuthNetworkError } from "./humanize-auth-error";
import { clearSigningOut, isSigningOut, markSigningOut, redirectToLoginAfterLogout } from "./constants";
import { isLocalDeviceAuthAllowed, isMockAuthAllowed } from "./mock-auth-allowed";
import { mockGetSession, mockLogin, mockLogout, mockRegister, mockVerifyCredentials } from "./mock-storage";
import { getSupabaseBrowser, ensureSupabaseBrowser, getSupabaseReachable } from "@/lib/supabase/browser-client";

export type AuthUser = {
  id: string;
  email: string;
  source: "supabase" | "mock";
  full_name?: string;
  business_name?: string;
};
export type SignUpMetadata = {
  full_name: string;
  business_name: string;
  full_name_or_business_name?: string;
  phone_number: string;
  service_category: "General Contractor" | "Renovations" | "Electricity" | "Cleaning" | "Other";
  service_area: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  resendConfirmation: (email: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    metadata?: SignUpMetadata
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  /** Re-read Supabase/mock session after transient auth flicker (e.g. token refresh). */
  revalidateSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function displayFieldsFromMetadata(meta: Record<string, unknown> | undefined): {
  full_name?: string;
  business_name?: string;
} {
  const m = meta ?? {};
  let full_name = String(m.full_name ?? m.fullName ?? "").trim();
  let business_name = String(m.business_name ?? m.businessName ?? "").trim();
  if (!full_name && !business_name) {
    const legacy = String(m.full_name_or_business_name ?? "").trim();
    if (legacy) {
      const match = legacy.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (match) {
        business_name = match[1].trim();
        full_name = match[2].trim();
      } else {
        full_name = legacy;
      }
    }
  }
  return {
    ...(full_name ? { full_name } : {}),
    ...(business_name ? { business_name } : {})
  };
}

/** Prefer business name for “Signed in as” and similar UI. */
export function authDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return "";
  return (
    user.business_name?.trim() ||
    user.full_name?.trim() ||
    user.email.split("@")[0] ||
    user.email
  );
}

function mapSupabaseUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    source: "supabase",
    ...displayFieldsFromMetadata(u.user_metadata as Record<string, unknown> | undefined)
  };
}

function isCloudUnavailable(status?: number, error?: string): boolean {
  return status === 503 || isAuthNetworkError(error ?? "");
}

function restoreLocalSession(): AuthUser | null {
  const m = mockGetSession();
  return m ? { ...m, source: "mock" as const } : null;
}

function tryMockLogin(
  email: string,
  password: string,
  setUser: (u: AuthUser) => void,
  signingOutRef?: MutableRefObject<boolean>
) {
  const local = mockLogin(email, password);
  if (local.user) {
    setUser({ ...local.user, source: "mock" });
    if (signingOutRef) completeSignIn(signingOutRef);
    return { ok: true as const };
  }
  return { ok: false as const, error: local.error };
}

function completeSignIn(signingOutRef: MutableRefObject<boolean>) {
  signingOutRef.current = false;
  clearSigningOut();
}

async function registerDeviceAccountInCloud(
  email: string,
  password: string,
  mockUser: { full_name?: string; business_name?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        metadata: {
          full_name: mockUser.full_name ?? "",
          business_name: mockUser.business_name ?? ""
        }
      })
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };

    if (res.ok || res.status === 409) {
      return { ok: true };
    }

    return { ok: false, error: payload.error ?? "Could not set up your cloud account." };
  } catch (err) {
    return {
      ok: false,
      error: humanizeAuthError(err instanceof Error ? err.message : "Could not reach the auth server.")
    };
  }
}

async function establishSessionFromLoginApi(
  email: string,
  password: string,
  setUser: (u: AuthUser) => void
): Promise<{ ok: true } | { ok: false; error: string; status?: number }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password })
  });
  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    access_token?: string;
    refresh_token?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      error: payload.error ?? "Could not sign in.",
      status: res.status
    };
  }

  if (!payload.access_token || !payload.refresh_token) {
    return { ok: false, error: "Invalid sign-in response from server.", status: 500 };
  }

  const supabase = await ensureSupabaseBrowser();
  if (!supabase) {
    return {
      ok: false,
      error:
        "Sign-in service is not configured on the server. Add Supabase environment variables in Vercel and redeploy.",
      status: 503
    };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token
  });

  if (error || !data.session?.user) {
    return {
      ok: false,
      error: humanizeAuthError(error?.message ?? "Could not save your session.")
    };
  }

  mockLogout();
  setUser(mapSupabaseUser(data.session.user));
  return { ok: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOutRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    void (async () => {
      let supabase: ReturnType<typeof getSupabaseBrowser>;
      try {
        supabase = (await ensureSupabaseBrowser()) ?? getSupabaseBrowser();
      } catch {
        supabase = null;
      }

      if (cancelled) return;

      if (!supabase) {
        setUser(() => (isLocalDeviceAuthAllowed() ? restoreLocalSession() : null));
        setLoading(false);
        return;
      }

      // Only discard device sessions once cloud auth is confirmed online.
      if (getSupabaseReachable() === true) {
        mockLogout();
      }

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          if (isSigningOut()) {
            try {
              await supabase.auth.signOut();
            } catch {
              // stale session after logout redirect — clear locally
            }
            setUser(null);
          } else {
            mockLogout();
            setUser(mapSupabaseUser(session.user));
          }
        } else {
          setUser(isLocalDeviceAuthAllowed() && !isSigningOut() ? restoreLocalSession() : null);
        }
      } catch {
        if (cancelled) return;
        setUser(isLocalDeviceAuthAllowed() && !isSigningOut() ? restoreLocalSession() : null);
      } finally {
        if (!cancelled) setLoading(false);
      }

      const {
        data: { subscription: sub }
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (signingOutRef.current || isSigningOut()) {
          if (isSigningOut() && session?.user) {
            void supabase.auth.signOut().catch(() => {});
          }
          if (isSigningOut()) setUser(null);
          return;
        }
        if (session?.user) {
          mockLogout();
          setUser(mapSupabaseUser(session.user));
          return;
        }
        // Do not clear the user on transient null sessions during token refresh/init.
        if (event === "SIGNED_OUT") {
          setUser(isLocalDeviceAuthAllowed() ? restoreLocalSession() : null);
        }
      });
      subscription = sub;
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  // Pick up mock session if state lags behind storage (e.g. right after login navigation).
  useEffect(() => {
    if (loading || user || isSigningOut()) return;
    const local = restoreLocalSession();
    if (local) setUser({ ...local, source: "mock" });
  }, [loading, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    await ensureSupabaseBrowser();

    // Offline / cloud unreachable — mock accounts on this device only.
    if (isLocalDeviceAuthAllowed()) {
      const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
      return mockAttempt.ok
        ? {}
        : {
            error:
              mockAttempt.error ??
              "Invalid email or password. Register first if you have not created an account on this device."
          };
    }

    const tryServerLogin = () => establishSessionFromLoginApi(email, password, setUser);

    if (!isMockAuthAllowed()) {
      const server = await tryServerLogin();
      if (server.ok) return {};

      if (server.status === 401) {
        const deviceUser = mockVerifyCredentials(email, password);
        if (deviceUser) {
          const registered = await registerDeviceAccountInCloud(email, password, deviceUser);
          if (!registered.ok && !isCloudUnavailable(undefined, registered.error)) {
            return { error: registered.error };
          }
          const retry = await tryServerLogin();
          if (retry.ok) return {};
          const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
          if (mockAttempt.ok) return {};
          return {
            error:
              retry.error ??
              "An account with this email already exists. Use Forgot password, then sign in again."
          };
        }
      }

      if (isCloudUnavailable(server.status, server.error)) {
        const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
        if (mockAttempt.ok) return {};
      }

      return { error: server.error };
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
      if (mockAttempt.ok) return {};
      return {
        error:
          mockAttempt.error ??
          "Invalid email or password. Register first if you have not created an account on this device."
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (!error && data.session?.user) {
        mockLogout();
        setUser(mapSupabaseUser(data.session.user));
        return {};
      }

      if (error) {
        const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
        if (mockAttempt.ok) return {};
        return { error: humanizeAuthError(error.message) };
      }

      const server = await tryServerLogin();
      if (server.ok) return {};

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        mockLogout();
        setUser(mapSupabaseUser(sessionData.session.user));
        return {};
      }

      if (!server.ok) return { error: server.error };
    } catch (err) {
      const server = await tryServerLogin();
      if (server.ok) return {};

      const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
      if (mockAttempt.ok) return {};

      const message = err instanceof Error ? err.message : "";
      if (message) return { error: humanizeAuthError(message) };
      if (!server.ok) return { error: server.error };
    }

    const mockAttempt = tryMockLogin(email, password, setUser, signingOutRef);
    if (mockAttempt.ok) return {};
    return {
      error:
        mockAttempt.error ??
        "Invalid email or password. Register first if you have not created an account on this device."
    };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = (await ensureSupabaseBrowser()) ?? getSupabaseBrowser();
    if (!supabase) return { error: "Email service is unavailable." };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email
    });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = (await ensureSupabaseBrowser()) ?? getSupabaseBrowser();
    if (!supabase) return { error: "Email service is unavailable." };
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: SignUpMetadata) => {
    const trimmedEmail = email.trim();
    await ensureSupabaseBrowser();

    const finishMock = () => {
      const reg = mockRegister(trimmedEmail, password, {
        full_name: metadata?.full_name,
        business_name: metadata?.business_name
      });
      const login = mockLogin(trimmedEmail, password);
      if (reg.error && !login.user) return reg;
      if (login.error) return { error: login.error };
      if (login.user) {
        setUser({ ...login.user, source: "mock" });
        completeSignIn(signingOutRef);
      }
      return {};
    };

    // Cloud is offline — register on this device immediately.
    if (isLocalDeviceAuthAllowed()) {
      return finishMock();
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password, metadata })
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string; ok?: boolean };

      if (res.ok || res.status === 409) {
        const session = await establishSessionFromLoginApi(trimmedEmail, password, setUser);
        if (session.ok) return {};
        if (isCloudUnavailable(session.status, session.error) || isLocalDeviceAuthAllowed()) {
          return finishMock();
        }
        if (res.ok) {
          return {
            error:
              session.error ??
              "Account was created but sign-in failed. Try logging in with your email and password."
          };
        }
        return {
          error:
            payload.error ??
            session.error ??
            "An account with this email already exists. Please log in."
        };
      }

      const serverMsg = String(payload.error ?? "");
      const isValidationError =
        res.status === 400 &&
        !isAuthNetworkError(serverMsg) &&
        (serverMsg.includes("Password must be") ||
          serverMsg.includes("Email and password are required") ||
          serverMsg.includes("Invalid request body"));

      if (isValidationError) {
        return { error: humanizeAuthError(serverMsg) };
      }

      if (isCloudUnavailable(res.status, serverMsg) || isLocalDeviceAuthAllowed()) {
        return finishMock();
      }

      if (payload.error) {
        return { error: humanizeAuthError(serverMsg) };
      }
    } catch {
      if (isLocalDeviceAuthAllowed()) {
        return finishMock();
      }
    }

    if (isLocalDeviceAuthAllowed()) {
      return finishMock();
    }

    return { error: "Could not create account. Check your connection and try again." };
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    markSigningOut();
    mockLogout();
    setUser(null);
    setLoading(false);

    const supabase = getSupabaseBrowser();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // redirect anyway — init on login will retry if session persists
      }
    }

    redirectToLoginAfterLogout();
  }, []);

  const revalidateSession = useCallback(async (): Promise<boolean> => {
    if (signingOutRef.current || isSigningOut()) return false;

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      const local = restoreLocalSession();
      if (local) {
        setUser({ ...local, source: "mock" });
        return true;
      }
      return false;
    }

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user) {
        mockLogout();
        setUser(mapSupabaseUser(session.user));
        return true;
      }
    } catch {
      // fall through
    }

    return false;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      resendConfirmation,
      requestPasswordReset,
      signUp,
      signOut,
      revalidateSession
    }),
    [user, loading, signIn, resendConfirmation, requestPasswordReset, signUp, signOut, revalidateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Safe optional hook for components outside provider (should not happen) */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}
