"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LANG_COOKIE, STORAGE_KEY } from "@/lib/i18n/constants";
import type { Language } from "@/lib/i18n/locales";

export type { Language };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function parseLangCookie(): Language | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=(en|hy|ru)(?:;|$)`));
  const v = m?.[1];
  return v === "en" || v === "hy" || v === "ru" ? v : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "en" || raw === "hy" || raw === "ru") {
        setLanguageState(raw);
        return;
      }
      const fromCookie = parseLangCookie();
      if (fromCookie) setLanguageState(fromCookie);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
      document.cookie = `${LANG_COOKIE}=${language};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => setLanguageState(next)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
