"use client";

import Link from "next/link";
import { Check, Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { FloatingPillHeader } from "@/components/floating-pill-header";
import { VstahLogo } from "@/components/vstah-logo";
import { SITE_BG_GRADIENT } from "@/lib/brand";
import { authDisplayName, useAuthOptional } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type LangOption = { code: Language; label: string };

function AuthLangSwitcher({
  langMenuOpen,
  onLangMenuOpenChange
}: {
  langMenuOpen: boolean;
  onLangMenuOpenChange: (open: boolean) => void;
}) {
  const { language: locale, setLanguage: setLocale } = useLanguage();

  const langSwitcherAria =
    locale === "hy" ? "Փոխել լեզուն" : locale === "ru" ? "Сменить язык" : "Change language";

  const langButtons = useMemo<LangOption[]>(
    () => [
      { code: "en", label: "English" },
      { code: "hy", label: "Հայերեն" },
      { code: "ru", label: "Русский" }
    ],
    []
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onLangMenuOpenChange(!langMenuOpen)}
        aria-label={langSwitcherAria}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10"
      >
        <Globe className="h-5 w-5" strokeWidth={2} />
      </button>
      {langMenuOpen ? (
        <div className="absolute right-0 top-12 z-50 min-w-[150px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg sm:min-w-[180px]">
          {langButtons.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLocale(item.code);
                onLangMenuOpenChange(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                locale === item.code ? "bg-slate-100 text-[#0033A0]" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{item.label}</span>
              {locale === item.code ? <Check className="h-4 w-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VstahShell({
  children,
  eyebrow,
  title,
  subtitle,
  maxWidthClass = "max-w-xl",
  hideAuthControls = false,
  hideHeader = false
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  /** Keeps the header neutral on auth pages so a session never flashes "Sign out" mid-redirect. */
  hideAuthControls?: boolean;
  /** Login/register: no marketing nav — logo + language only. */
  hideHeader?: boolean;
}) {
  const auth = useAuthOptional();
  const { language } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tx =
    language === "hy"
      ? { signOut: "Դուրս գալ", home: "Գլխավոր" }
      : language === "ru"
        ? { signOut: "Выйти", home: "Главная" }
        : { signOut: "Sign out", home: "Home" };

  const displayName = authDisplayName(auth?.user);

  const authActions =
    auth?.user && !hideAuthControls ? (
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
    auth?.user && !hideAuthControls ? (
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
      {hideHeader ? (
        <div className="relative z-20 flex items-center justify-between px-4 pt-5 sm:px-6 sm:pt-6">
          <Link href="/" className="inline-flex items-center gap-2.5 text-white transition hover:text-white/90">
            <VstahLogo size={32} alt="VSTAH" className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-tight">VSTAH</span>
            <span className="hidden text-xs text-white/55 sm:inline">· {tx.home}</span>
          </Link>
          <AuthLangSwitcher langMenuOpen={langMenuOpen} onLangMenuOpenChange={setLangMenuOpen} />
        </div>
      ) : (
        <FloatingPillHeader
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          langMenuOpen={langMenuOpen}
          onLangMenuOpenChange={setLangMenuOpen}
          loginHref="/login"
          registerHref="/register"
          showGuestActions={hideAuthControls || !auth?.user}
          authActions={authActions}
          mobileMenuFooter={mobileMenuFooter}
        />
      )}

      <main
        className={`flex flex-1 flex-col px-3 sm:px-4 md:px-6 ${hideHeader ? "justify-center py-8 sm:py-10" : "py-8 sm:py-10"}`}
      >
        <div className={`mx-auto w-full min-w-0 ${maxWidthClass}`}>
          {eyebrow ? (
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 sm:text-xs">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-2 text-center text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-white/85 sm:text-base">
              {subtitle}
            </p>
          ) : null}

          <div
            className={`mt-6 border border-slate-200/90 bg-white p-5 sm:mt-8 sm:p-6 md:mt-10 md:p-8 ${
              hideHeader ? "vstah-soft-shadow-lg rounded-2xl" : "rounded-2xl shadow-2xl shadow-black/20 sm:rounded-3xl"
            }`}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
