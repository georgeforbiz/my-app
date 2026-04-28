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
import { humanizeAuthError } from "./humanize-auth-error";
import { mockGetSession, mockLogin, mockLogout, mockRegister } from "./mock-storage";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";

export type AuthUser = { id: string; email: string; source: "supabase" | "mock" };
export type SignUpMetadata = {
  full_name_or_business_name: string;
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

function mapSupabaseUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    source: "supabase"
  };
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
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: humanizeAuthError(error.message) } : {};
    }
    const res = mockLogin(email, password);
    if (res.error) return { error: res.error };
    if (res.user) setUser({ ...res.user, source: "mock" });
    return {};
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return {};
    const { error } = await supabase.auth.resend({
      type: "signup",
      email
    });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return {};
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: SignUpMetadata) => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login?email=${encodeURIComponent(email)}` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo
        }
      });
      if (error) return { error: humanizeAuthError(error.message) };
      // If session is missing, attempt immediate password sign-in.
      // This keeps auto-login working when email confirmation is disabled.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          const humanized = humanizeAuthError(signInError.message);
          if (humanized.toLowerCase().includes("confirm")) {
            return { needsEmailConfirmation: true };
          }
          return { error: humanized };
        }
      }
      return {};
    }
    const reg = mockRegister(email, password);
    if (reg.error) return reg;
    const res = mockLogin(email, password);
    if (res.error) return { error: res.error };
    if (res.user) setUser({ ...res.user, source: "mock" });
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    else mockLogout();
    setUser(null);
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
