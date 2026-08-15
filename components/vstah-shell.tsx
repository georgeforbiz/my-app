"use client";

import { useState } from "react";
import { FloatingPillHeader } from "@/components/floating-pill-header";
import { SITE_BG_GRADIENT } from "@/lib/brand";
import { authDisplayName, useAuthOptional } from "@/lib/auth/auth-context";
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
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tx =
    language === "hy"
      ? { signOut: "Դուրս գալ" }
      : language === "ru"
        ? { signOut: "Выйти" }
        : { signOut: "Sign out" };

  const displayName = authDisplayName(auth?.user);

  const authActions =
    auth?.user ? (
      <>
        <span
          className="hidden max-w-[10rem] truncate text-sm text-slate-700 lg:inline xl:max-w-[12rem]"
          title={displayName}
        >
          {displayName}
        </span>
        <button
          type="button"
          onClick={() => void auth.signOut()}
          className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 sm:h-11 sm:px-5"
        >
          {tx.signOut}
        </button>
      </>
    ) : undefined;

  const mobileMenuFooter =
    auth?.user ? (
      <div className="space-y-2">
        <p className="truncate px-3 text-xs text-slate-500" title={displayName}>
          {displayName}
        </p>
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            void auth.signOut();
          }}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900"
        >
          {tx.signOut}
        </button>
      </div>
    ) : undefined;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip" style={{ background: SITE_BG_GRADIENT }}>
      <FloatingPillHeader
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        langMenuOpen={langMenuOpen}
        onLangMenuOpenChange={setLangMenuOpen}
        loginHref="/login"
        registerHref="/register"
        showGuestActions={!auth?.user}
        authActions={authActions}
        mobileMenuFooter={mobileMenuFooter}
      />

      <main className="flex flex-1 flex-col px-3 py-8 sm:px-4 sm:py-10 md:px-6">
        <div className={`mx-auto w-full min-w-0 ${maxWidthClass}`}>
          {eyebrow ? (
            <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.25em]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-center text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-lg text-center text-sm text-white/85 sm:text-base">{subtitle}</p>
          ) : null}

          <div className="mt-6 rounded-2xl border border-white/15 bg-white p-5 shadow-2xl shadow-black/20 sm:mt-8 sm:rounded-3xl sm:p-6 md:mt-10 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
