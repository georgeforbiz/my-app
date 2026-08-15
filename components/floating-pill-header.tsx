"use client";

import Link from "next/link";
import { Check, Globe, Menu, X } from "lucide-react";
import { useMemo } from "react";
import { ORANGE } from "@/lib/brand";
import { useLanguage } from "@/lib/i18n/language-context";
import type { Language } from "@/lib/i18n/locales";

type LangOption = { code: Language; label: string };

type Props = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  langMenuOpen: boolean;
  onLangMenuOpenChange: (open: boolean) => void;
  loginHref?: string;
  registerHref?: string;
  /** Desktop + mobile guest CTAs (login / get started). Omit when using `authActions`. */
  showGuestActions?: boolean;
  /** Replaces guest CTAs when user is signed in (desktop column). */
  authActions?: React.ReactNode;
  /** Extra block at bottom of mobile menu (e.g. sign out when signed in). */
  mobileMenuFooter?: React.ReactNode;
};

export function FloatingPillHeader({
  mobileOpen,
  onMobileOpenChange,
  langMenuOpen,
  onLangMenuOpenChange,
  loginHref = "/login?next=%2Fdashboard",
  registerHref = "/register?next=%2Fdashboard",
  showGuestActions = true,
  authActions,
  mobileMenuFooter
}: Props) {
  const { language: locale, setLanguage: setLocale } = useLanguage();

  const tx =
    locale === "hy"
      ? {
          brand: "VSTAH",
          navHome: "Գլխավոր",
          navHowItWorks: "Ինչպես է աշխատում",
          navPricing: "Գին",
          login: "Մուտք",
          getStarted: "Սկսել",
          langSwitcherAria: "Փոխել լեզուն",
          menuAria: "Մենյու"
        }
      : locale === "ru"
        ? {
            brand: "VSTAH",
            navHome: "Главная",
            navHowItWorks: "Как это работает",
            navPricing: "Тарифы",
            login: "Войти",
            getStarted: "Начать",
            langSwitcherAria: "Сменить язык",
            menuAria: "Меню"
          }
        : {
            brand: "VSTAH",
            navHome: "Home",
            navHowItWorks: "How it works",
            navPricing: "Pricing",
            login: "Log in",
            getStarted: "Get started",
            langSwitcherAria: "Change language",
            menuAria: "Menu"
          };

  const langButtons = useMemo<LangOption[]>(
    () => [
      { code: "en", label: "English" },
      { code: "hy", label: "Հայերեն" },
      { code: "ru", label: "Русский" }
    ],
    []
  );

  const closeMobile = () => onMobileOpenChange(false);

  const langSwitcher = (compact: boolean) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => onLangMenuOpenChange(!langMenuOpen)}
        aria-label={tx.langSwitcherAria}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-slate-100 sm:h-11 sm:w-11"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#F2A800] via-[#D90012] to-[#0033A0] text-white shadow-sm sm:h-8 sm:w-8">
          <Globe className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </span>
      </button>
      {langMenuOpen ? (
        <div
          className={`absolute z-50 min-w-[150px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl sm:min-w-[180px] ${
            compact ? "right-0 top-12" : "right-0 top-14"
          }`}
        >
          {langButtons.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLocale(item.code);
                onLangMenuOpenChange(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
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

  const guestDesktopActions = showGuestActions ? (
    <>
      <Link
        href={loginHref}
        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 sm:h-11 sm:px-6"
      >
        {tx.login}
      </Link>
      <Link
        href={registerHref}
        className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-slate-900 transition hover:brightness-105 sm:h-11 sm:px-6"
        style={{ backgroundColor: ORANGE }}
      >
        {tx.getStarted}
      </Link>
    </>
  ) : null;

  const guestMobileActions = showGuestActions ? (
    <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
      <Link
        href={loginHref}
        onClick={closeMobile}
        className="inline-flex h-11 items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-900"
      >
        {tx.login}
      </Link>
      <Link
        href={registerHref}
        onClick={closeMobile}
        className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-slate-900"
        style={{ backgroundColor: ORANGE }}
      >
        {tx.getStarted}
      </Link>
    </div>
  ) : null;

  return (
    <header className="relative z-50 px-3 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6">
      <div className="relative mx-auto w-full min-w-0 max-w-[min(100%,90rem)]">
        <div className="grid min-h-[3.75rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/50 bg-white px-3 py-2.5 shadow-[0_14px_44px_-12px_rgba(0,0,0,0.4)] sm:min-h-[4.75rem] sm:gap-3 sm:rounded-full sm:px-5 sm:py-3 md:min-h-[5.25rem] md:px-8 lg:px-10">
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              href="/"
              className="flex min-w-0 shrink items-center gap-2 text-slate-900 sm:gap-2.5"
            >
              <img
                src="/logo-vstah-clean.png"
                alt="VSTAH logo"
                className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10 md:h-11 md:w-11"
              />
              <span className="truncate text-base font-bold tracking-tight sm:text-lg md:text-xl">{tx.brand}</span>
            </Link>

            <nav className="hidden min-w-0 items-center gap-5 border-slate-200/80 text-sm font-semibold text-slate-800 md:ml-10 md:flex md:border-l md:pl-10 lg:ml-12 lg:gap-7 lg:pl-12 xl:ml-14 xl:gap-8 xl:pl-14">
              <Link href="/" className="whitespace-nowrap transition hover:text-slate-950">
                {tx.navHome}
              </Link>
              <Link href="/#difference" className="whitespace-nowrap transition hover:text-slate-950">
                {tx.navHowItWorks}
              </Link>
              <Link href="/#pricing" className="whitespace-nowrap transition hover:text-slate-950">
                {tx.navPricing}
              </Link>
            </nav>
          </div>

          <div className="hidden min-w-0 items-center justify-self-end gap-2 md:flex lg:gap-2.5">
            {langSwitcher(false)}
            {authActions ?? guestDesktopActions}
          </div>

          <div className="flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-2 md:hidden">
            {langSwitcher(true)}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition hover:bg-slate-200 sm:h-11 sm:w-11"
              aria-expanded={mobileOpen}
              aria-label={tx.menuAria}
              onClick={() => {
                onLangMenuOpenChange(false);
                onMobileOpenChange(!mobileOpen);
              }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] sm:rounded-3xl md:hidden">
            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                onClick={closeMobile}
              >
                {tx.navHome}
              </Link>
              <Link
                href="/#difference"
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                onClick={closeMobile}
              >
                {tx.navHowItWorks}
              </Link>
              <Link
                href="/#pricing"
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                onClick={closeMobile}
              >
                {tx.navPricing}
              </Link>
            </nav>
            {(guestMobileActions || mobileMenuFooter) && <div className="my-3 h-px bg-slate-100" />}
            {guestMobileActions}
            {mobileMenuFooter}
          </div>
        ) : null}
      </div>
    </header>
  );
}
