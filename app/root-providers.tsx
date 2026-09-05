"use client";

import type { ReactNode } from "react";
import { ClientErrorBoundary } from "@/components/client-error-boundary";
import { DocumentMeta } from "@/components/document-meta";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { DEFAULT_LANGUAGE, type Language } from "@/lib/i18n/locales";

export function RootProviders({
  children,
  initialLanguage = DEFAULT_LANGUAGE
}: {
  children: ReactNode;
  /** From server `cookies()` so first paint matches `<html lang>` before client storage runs. */
  initialLanguage?: Language;
}) {
  return (
    <ClientErrorBoundary>
      <LanguageProvider initialLanguage={initialLanguage}>
        <DocumentMeta />
        {children}
      </LanguageProvider>
    </ClientErrorBoundary>
  );
}
