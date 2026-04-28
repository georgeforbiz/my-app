"use client";

import type { ReactNode } from "react";
import { DocumentMeta } from "@/components/document-meta";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <DocumentMeta />
      {children}
    </LanguageProvider>
  );
}
