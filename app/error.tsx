"use client";

import { NAVY, ORANGE } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/language-context";
import { errorPageCopy } from "@/lib/i18n/legal-static";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useLanguage();
  const t = errorPageCopy[language];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white"
      style={{ backgroundColor: NAVY }}
    >
      <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
      <p className="max-w-md text-sm text-white/85">{t.body}</p>
      {process.env.NODE_ENV === "development" ? (
        <p className="max-w-lg break-all text-xs text-white/60">{error.message}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl px-6 py-3 text-sm font-bold text-slate-900 shadow-lg"
          style={{ backgroundColor: ORANGE }}
        >
          {t.tryAgain}
        </button>
        <a
          href="/"
          className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          {t.home}
        </a>
      </div>
    </div>
  );
}
