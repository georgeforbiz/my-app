"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Activity, LayoutDashboard, Landmark, Users } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Stats", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/agreements", label: "Transfer Approvals", icon: Landmark, exact: false },
  { href: "/admin/activity", label: "Activity", icon: Activity, exact: false }
] as const;

const LOGIN_PATH = "/admin/login";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginRoute = pathname === LOGIN_PATH;

  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    let active = true;
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
  }, [pathname]);

  useEffect(() => {
    if (checking || isLoginRoute || authenticated) return;
    router.replace(LOGIN_PATH);
  }, [checking, isLoginRoute, authenticated, router]);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace(LOGIN_PATH);
    router.refresh();
  }, [router]);

  if (isLoginRoute) return <>{children}</>;

  if (checking || !authenticated) {
    return <div className="min-h-dvh bg-[#F9FAFB] p-6 text-slate-700">Loading admin...</div>;
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F9FAFB] text-slate-900">
      <aside className="hidden h-full w-72 shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
        <h1 className="text-2xl font-black">VSTAH Admin</h1>
        <p className="mt-2 text-sm text-blue-100">Local / demo control panel</p>
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
          <div className="flex items-center gap-2 overflow-x-auto lg:hidden">
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
