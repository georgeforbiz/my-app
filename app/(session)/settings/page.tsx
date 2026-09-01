"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProviderProfileSettings } from "@/components/provider-profile-settings";
import { useAuth } from "@/lib/auth/auth-context";
import { isSigningOut } from "@/lib/auth/constants";
import { ROUTES, LOGIN_FOR_SETTINGS } from "@/lib/routes";
import { useLanguage } from "@/lib/i18n/language-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguage();

  const tx =
    language === "hy"
      ? { dashboard: "Վահանակ", settings: "Կարգավորումներ" }
      : language === "ru"
        ? { dashboard: "Панель", settings: "Настройки" }
        : { dashboard: "Dashboard", settings: "Settings" };

  useEffect(() => {
    if (loading || user || isSigningOut()) return;
    router.replace(LOGIN_FOR_SETTINGS);
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] text-sm text-slate-600">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.settings}</p>
            <Link href={ROUTES.dashboard} className="text-sm font-semibold text-[#0033A0] hover:underline">
              ← {tx.dashboard}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
        <ProviderProfileSettings backHref={ROUTES.dashboard} />
      </main>
    </div>
  );
}
