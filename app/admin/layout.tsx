"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";

const navItems = [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] as const;

const LOGIN_PATH = "/admin/login";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === LOGIN_PATH;

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    if (isLoginRoute) {
      setChecking(false);
      return;
    }

    let active = true;
    setChecking(true);
    void (async () => {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "same-origin"
        });
        const data = (await res.json().catch(() => ({}))) as {
          authenticated?: boolean;
          email?: string;
        };
        if (!active) return;
        setAuthenticated(Boolean(data.authenticated));
        setAdminEmail(data.email ?? "");
      } catch {
        if (active) setAuthenticated(false);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isLoginRoute]);

  useEffect(() => {
    if (checking || isLoginRoute || authenticated) return;
    router.replace(LOGIN_PATH);
  }, [checking, isLoginRoute, authenticated, router]);

  useEffect(() => {
    if (!authenticated) return;
    for (const item of navItems) router.prefetch(item.href);
  }, [authenticated, router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Network failure — still clear local session below.
    }
    router.replace(LOGIN_PATH);
    router.refresh();
  }, [router]);

  if (isLoginRoute) return <>{children}</>;

  if (checking || !authenticated) {
    return (
      <div className="fixed inset-0 flex overflow-hidden bg-[#F9FAFB]">
        <aside className="hidden h-full w-72 shrink-0 flex-col bg-[#0033A0] p-6 lg:flex">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-white/20" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-8 h-10 animate-pulse rounded-xl bg-white/15" />
          <div className="mt-auto space-y-3">
            <div className="h-3 w-36 animate-pulse rounded bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/20" />
          </div>
        </aside>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
              ))}
            </div>
            <div className="h-[28rem] animate-pulse rounded-2xl border border-slate-200 bg-white" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F9FAFB] text-slate-900">
      <aside className="hidden h-full w-72 shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
        <h1 className="text-2xl font-black">VSTAH Admin</h1>
        <p className="mt-2 text-sm text-blue-100">Essential metrics & users</p>
        <nav className="mt-8 space-y-2">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${
                  active ? "bg-white text-[#0033A0]" : "text-blue-100 hover:bg-blue-700/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <p className="truncate text-xs text-blue-100" title={adminEmail}>
            Admin: {adminEmail}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0033A0]"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            {navItems.map(({ href, label }) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
                    active
                      ? "border-[#0033A0] bg-[#0033A0] text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void logout()}
              className="ml-auto shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
            >
              Log out
            </button>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
