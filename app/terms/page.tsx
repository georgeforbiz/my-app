"use client";

import Link from "next/link";
import { useEffect } from "react";
import { NAVY } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/language-context";
import { termsLegal } from "@/lib/i18n/legal-static";

export default function TermsPage() {
  const { language } = useLanguage();
  const t = termsLegal[language];

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
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{t.lead}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 md:text-base">
          <section>
            <h2 className="text-lg font-bold text-slate-900">{t.s1h}</h2>
            <p className="mt-2">{t.s1p}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">{t.s2h}</h2>
            <p className="mt-2">{t.s2p}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">{t.s3h}</h2>
            <p className="mt-2">{t.s3p}</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">{t.s4h}</h2>
            <p className="mt-2">
              {t.s4pBefore}{" "}
              <a href="tel:+37411550550" className="font-semibold text-slate-900">
                +374 11 550 550
              </a>
              {t.s4pAfter}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
