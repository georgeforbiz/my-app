"use client";

import { Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listLocalAgreements } from "@/lib/agreements/local-store";
import { listMockUsers } from "@/lib/auth/mock-storage";
import { formatDateDMY } from "@/lib/format-date";

type AdminStats = {
  users: number;
  agreements: number;
  signed: number;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone_number: string | null;
  created_at: string;
};

const EMPTY_STATS: AdminStats = { users: 0, agreements: 0, signed: 0 };
const PAGE_SIZE = 20;
const SKELETON_ROWS = 8;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

function displayName(user: AdminUser): string {
  const business = user.business_name?.trim();
  const full = user.full_name?.trim();
  if (business) return business;
  if (full) return full;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] || email;
  return "—";
}

function userHaystack(user: AdminUser): string {
  return [displayName(user), user.email, user.phone_number, user.full_name, user.business_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function localStats(): AdminStats {
  const agreements = listLocalAgreements();
  return {
    users: listMockUsers().length,
    agreements: agreements.length,
    signed: agreements.filter((a) => a.status === "signed" || a.status === "completed").length
  };
}

function localUsers(): AdminUser[] {
  return listMockUsers().map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? "",
    business_name: u.business_name ?? "",
    phone_number: u.phone_number ?? null,
    created_at: ""
  }));
}

function mergeStats(cloud: AdminStats, local: AdminStats): AdminStats {
  return {
    users: Math.max(cloud.users, local.users),
    agreements: Math.max(cloud.agreements, local.agreements),
    signed: Math.max(cloud.signed, local.signed)
  };
}

function mergeUsers(cloud: AdminUser[], local: AdminUser[]): AdminUser[] {
  const byEmail = new Map<string, AdminUser>();
  for (const user of cloud) byEmail.set(user.email.toLowerCase(), user);
  for (const user of local) {
    if (!byEmail.has(user.email.toLowerCase())) byEmail.set(user.email.toLowerCase(), user);
  }
  return [...byEmail.values()].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.email.localeCompare(b.email);
  });
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localStat = localStats();
    const localUserRows = localUsers();

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setNotice("");
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch("/api/admin/stats", { cache: "no-store", credentials: "same-origin" }),
          fetch("/api/admin/users", { cache: "no-store", credentials: "same-origin" })
        ]);

        const statsData = (await statsRes.json().catch(() => ({}))) as Partial<AdminStats> & {
          error?: string;
          warning?: string;
        };
        const usersData = (await usersRes.json().catch(() => ({}))) as {
          users?: Array<AdminUser & { phone_number?: string | null }>;
          error?: string;
        };

        if (cancelled) return;

        const cloudStats: AdminStats = {
          users: Number(statsData.users ?? 0),
          agreements: Number(statsData.agreements ?? 0),
          signed: Number(statsData.signed ?? 0)
        };
        const cloudUsers = (usersData.users ?? []).map((u) => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name ?? "",
          business_name: u.business_name ?? "",
          phone_number: u.phone_number ?? null,
          created_at: u.created_at ?? ""
        }));

        const cloudEmpty =
          cloudStats.users === 0 && cloudStats.agreements === 0 && cloudUsers.length === 0;

        setStats(mergeStats(cloudStats, localStat));
        setUsers(mergeUsers(cloudUsers, localUserRows));
        setNotice(
          statsData.warning ||
            statsData.error ||
            usersData.error ||
            (cloudEmpty ? "Cloud data unavailable — showing local demo data from this browser." : "")
        );
      } catch {
        if (!cancelled) {
          setStats(localStat);
          setUsers(localUserRows);
          setNotice("Cloud data unavailable — showing local demo data from this browser.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => userHaystack(user).includes(q));
  }, [users, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    setPage((p) => Math.min(p, maxPage));
  }, [filteredUsers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);

  const rangeStart = filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredUsers.length);

  const cards = useMemo(
    () => [
      { label: "Total Registered Users", value: stats.users },
      { label: "Total Agreements Created", value: stats.agreements },
      { label: "Signed Agreements", value: stats.signed }
    ],
    [stats]
  );

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#0033A0]">Dashboard</h2>
            <p className="mt-1 text-sm text-slate-600">Essential metrics from Supabase.</p>
          </div>
        </div>
      </header>

      {notice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {notice}
        </div>
      ) : null}

      <div
        className={`grid gap-3 transition-opacity duration-300 sm:grid-cols-3 ${loading ? "opacity-80" : "opacity-100"}`}
      >
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="mt-2 text-3xl font-black text-[#0033A0]">{card.value}</p>
            )}
          </div>
        ))}
      </div>

      <section
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity duration-300 ${loading ? "opacity-80" : "opacity-100"}`}
      >
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-5 md:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0033A0]/10 text-[#0033A0]">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">Users</h3>
                  {loading ? (
                    <Skeleton className="h-6 w-10 rounded-full" />
                  ) : (
                    <span className="rounded-full bg-[#0033A0]/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-[#0033A0]">
                      {search.trim() ? `${filteredUsers.length} / ${users.length}` : users.length}
                    </span>
                  )}
                </div>
                <label className="relative min-w-[11rem] flex-1 sm:ml-auto sm:w-72 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, phone"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0033A0] focus:outline-none focus:ring-2 focus:ring-[#0033A0]/15 disabled:cursor-wait disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </label>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {search.trim() ? "Matching registered accounts" : "All registered accounts"}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <article key={`sk-mobile-${i}`} className="space-y-2 px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-full max-w-xs" />
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </article>
              ))
            : paginatedUsers.map((user) => (
                <article key={user.id} className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{displayName(user)}</p>
                  <p className="mt-0.5 break-all text-sm text-slate-600">{user.email || "—"}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{user.phone_number || "—"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {user.created_at ? formatDateDMY(user.created_at) : "—"}
                  </p>
                </article>
              ))}
          {!loading && filteredUsers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">
              {search.trim() ? "No users match your search." : "No users found."}
            </p>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                    <tr key={`sk-desktop-${i}`} className="border-b border-slate-100">
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    </tr>
                  ))
                : paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-900">{displayName(user)}</td>
                      <td className="px-4 py-3 text-slate-700">{user.email || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{user.phone_number || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {user.created_at ? formatDateDMY(user.created_at) : "—"}
                      </td>
                    </tr>
                  ))}
              {!loading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                    {search.trim() ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!loading && filteredUsers.length > PAGE_SIZE ? (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <p className="text-sm text-slate-500">
              Showing {rangeStart}–{rangeEnd} of {filteredUsers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="min-w-[4.5rem] text-center text-sm font-semibold tabular-nums text-slate-600">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
