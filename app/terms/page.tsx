"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LegalDocumentBody } from "@/components/legal-document-body";
import { NAVY } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/language-context";
import { termsLegal } from "@/lib/i18n/legal-static";

export default function TermsPage() {
  const { language } = useLanguage();
  const t = termsLegal[language] ?? termsLegal.en;

  useEffect(() => {
    document.title = t.documentTitle;
  }, [t.documentTitle]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-10">
        <Link href="/" className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline">
          {t.backToHome}
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
          {t.h1}
        </h1>

        <LegalDocumentBody content={t} />
      </div>
    </main>
  );
}
