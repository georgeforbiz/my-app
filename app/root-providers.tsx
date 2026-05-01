"use client";

import type { ReactNode } from "react";
import { DocumentMeta } from "@/components/document-meta";
import { LanguageProvider } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

export function RootProviders({
  children,
  initialLanguage = "en"
}: {
  children: ReactNode;
  /** From server `cookies()` so first paint matches `<html lang>` before client storage runs. */
  initialLanguage?: Language;
}) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <DocumentMeta />
      {children}
    </LanguageProvider>
  );
}
