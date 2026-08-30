"use client";

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { humanizeAuthError, isAuthNetworkError } from "./humanize-auth-error";
import { mockGetSession, mockLogin, mockLogout, mockRegister } from "./mock-storage";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";

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

function tryMockLogin(email: string, password: string, setUser: (u: AuthUser) => void) {
  const local = mockLogin(email, password);
  if (local.user) {
    setUser({ ...local.user, source: "mock" });
    return { ok: true as const };
  }
  return { ok: false as const, error: local.error };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser>;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      supabase = null;
    }

    if (!supabase) {
      setUser(() => {
        const m = mockGetSession();
        return m ? { ...m, source: "mock" as const } : null;
      });
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session?.user) {
          mockLogout();
          setUser(mapSupabaseUser(session.user));
          return;
        }
        const mockSession = mockGetSession();
        setUser(mockSession ? { ...mockSession, source: "mock" } : null);
      })
      .catch(() => {
        const m = mockGetSession();
        setUser(m ? { ...m, source: "mock" } : null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        mockLogout();
        setUser(mapSupabaseUser(session.user));
        return;
      }
      const mockSession = mockGetSession();
      setUser(mockSession ? { ...mockSession, source: "mock" } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      try {
        const result = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 3_000);
          })
        ]);
        if (result !== null && !result.error) {
          mockLogout();
          return {};
        }
        if (result !== null && result.error && !isAuthNetworkError(result.error.message)) {
          const mockAttempt = tryMockLogin(email, password, setUser);
          if (mockAttempt.ok) return {};
          return { error: humanizeAuthError(result.error.message) };
        }
      } catch {
        // Cloud unreachable — use local mock auth.
      }
    }

    const mockAttempt = tryMockLogin(email, password, setUser);
    if (mockAttempt.ok) return {};
    return {
      error:
        mockAttempt.error ??
        "Invalid email or password. Register first if you have not created an account on this device."
    };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: "Email service is unavailable." };
    const { error } = await supabase.auth.resend({
      type: "signup",
      email
    });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return { error: "Email service is unavailable." };
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: SignUpMetadata) => {
    const trimmedEmail = email.trim();

    const finishMock = () => {
      const reg = mockRegister(trimmedEmail, password, {
        full_name: metadata?.full_name,
        business_name: metadata?.business_name
      });
      const login = mockLogin(trimmedEmail, password);
      // An existing local account is fine when cloud registration succeeded but
      // establishing the cloud session timed out.
      if (reg.error && !login.user) return reg;
      if (login.error) return { error: login.error };
      if (login.user) setUser({ ...login.user, source: "mock" });
      return {};
    };

    // Try cloud register quickly; if Supabase is down, use local mock immediately.
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3_000);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password, metadata }),
        signal: controller.signal
      });
      window.clearTimeout(timeout);
      const payload = (await res.json().catch(() => ({}))) as { error?: string; code?: string; ok?: boolean };

      if (res.ok) {
        const supabase = getSupabaseBrowser();
        if (supabase) {
          try {
            const signInResult = await Promise.race([
              supabase.auth.signInWithPassword({ email: trimmedEmail, password }),
              new Promise<null>((resolve) => {
                window.setTimeout(() => resolve(null), 3_000);
              })
            ]);
            if (signInResult && !signInResult.error && signInResult.data.user) {
              setUser(mapSupabaseUser(signInResult.data.user));
              return {};
            }
          } catch {
            // fall through to mock
          }
        }
        // Cloud user may exist, but client auth timed out — local session so the app is usable.
        return finishMock();
      }

      if (res.status === 409) {
        const mockResult = finishMock();
        if (!mockResult.error) return mockResult;
        return { error: payload.error ?? "An account with this email already exists. Please log in." };
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
    } catch {
      // Timeout / network — mock auth.
    }

    return finishMock();
  }, []);

  const signOut = useCallback(async () => {
    // Always clear local mock session first so auth listeners cannot restore it.
    mockLogout();
    setUser(null);

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, 2_000);
        })
      ]);
    } catch {
      // Supabase unreachable — local logout already completed.
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, resendConfirmation, requestPasswordReset, signUp, signOut }),
    [user, loading, signIn, resendConfirmation, requestPasswordReset, signUp, signOut]
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
