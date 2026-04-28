"use client";

import Link from "next/link";
import { NAVY } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";
import { OrangeButton } from "@/components/vstah-button";
import { useLanguage } from "@/lib/i18n/language-context";

export function VstahShell({
  children,
  eyebrow,
  title,
  subtitle,
  maxWidthClass = "max-w-xl"
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
}) {
  const auth = useAuthOptional();
  const { language } = useLanguage();
  const tx =
    language === "hy"
      ? { signOut: "Դուրս գալ", login: "Մուտք", register: "Գրանցվել" }
      : language === "ru"
        ? { signOut: "Выйти", login: "Войти", register: "Регистрация" }
        : { signOut: "Sign out", login: "Login", register: "Register" };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: NAVY }}>
      <header
        className="sticky top-0 z-40 border-b border-black/10 bg-white shadow-lg shadow-black/10"
      >
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-3 px-4 md:h-[84px] md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
            <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-10 w-10 md:h-11 md:w-11" />
            <span className="text-lg font-bold tracking-tight md:text-xl">VSTAH.am</span>
          </Link>

          <div className="flex items-center justify-end gap-2 md:gap-3">
            {auth?.loading ? (
              <span className="inline-flex h-8 min-w-[70px] items-center justify-center text-xs text-slate-500">…</span>
            ) : auth?.user ? (
              <>
                <span className="hidden truncate text-sm text-slate-700 sm:inline max-w-[12rem]" title={auth.user.email}>
                  {auth.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void auth.signOut()}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
                >
                  {tx.signOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:text-sm"
                >
                  {tx.login}
                </Link>
                <OrangeButton href="/register" className="px-4 py-2 text-xs sm:text-sm">
                  {tx.register}
                </OrangeButton>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-10 md:px-6">
        <div className={`mx-auto w-full ${maxWidthClass}`}>
          {eyebrow ? (
            <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-white/70">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
          {subtitle ? <p className="mx-auto mt-3 max-w-lg text-center text-base text-white/85">{subtitle}</p> : null}

          <div className="mt-10 rounded-3xl border border-white/15 bg-white p-6 shadow-2xl shadow-black/20 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
