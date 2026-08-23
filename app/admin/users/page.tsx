"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listLocalAgreements } from "@/lib/agreements/local-store";
import { listMockUsers } from "@/lib/auth/mock-storage";
import { formatDateDMY } from "@/lib/format-date";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone_number: string | null;
  service_category: string | null;
  service_area: string | null;
  created_at: string;
  agreement_count: number;
};

function localUsers(): AdminUser[] {
  const agreements = listLocalAgreements();
  return listMockUsers().map((u) => ({
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? "",
    business_name: u.business_name ?? "",
    phone_number: null,
    service_category: null,
    service_area: null,
    created_at: "",
    agreement_count: agreements.filter((a) => a.provider_id === u.id).length
  }));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(() => localUsers());
  const [total, setTotal] = useState(() => localUsers().length);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const loadSeqRef = useRef(0);

  const load = useCallback(async (q: string) => {
    const seq = ++loadSeqRef.current;
    const isStale = () => seq !== loadSeqRef.current;

    setLoading(true);
    const local = localUsers();
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/admin/users${params}`, {
        cache: "no-store",
        credentials: "same-origin"
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        warning?: string;
        total?: number;
        users?: AdminUser[];
      };

      const cloud = data.users ?? [];
      if (!res.ok) {
        if (isStale()) return;
        const filtered = q.trim()
          ? local.filter((u) =>
              [u.email, u.full_name, u.business_name, u.phone_number]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q.trim().toLowerCase())
            )
          : local;
        setUsers(filtered);
        setTotal(local.length);
        setNotice(
          data.error ||
            "Cloud users unavailable — showing mock accounts registered in this browser."
        );
        return;
      }

      // Empty cloud with an API error still means the backend is down.
      if (cloud.length === 0 && data.error) {
        if (isStale()) return;
        const filtered = q.trim()
          ? local.filter((u) =>
              [u.email, u.full_name, u.business_name, u.phone_number]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(q.trim().toLowerCase())
            )
          : local;
        setUsers(filtered);
        setTotal(local.length);
        setNotice(data.error);
        return;
      }

      // Merge cloud + local by email so demo accounts still appear.
      const byEmail = new Map<string, AdminUser>();
      for (const u of cloud) byEmail.set(u.email.toLowerCase(), u);
      for (const u of local) {
        if (!byEmail.has(u.email.toLowerCase())) byEmail.set(u.email.toLowerCase(), u);
      }
      let merged = [...byEmail.values()];
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        merged = merged.filter((u) =>
          [u.email, u.full_name, u.business_name, u.phone_number, u.service_category, u.service_area]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle)
        );
      }
      if (isStale()) return;
      setUsers(merged);
      setTotal(Math.max(data.total ?? cloud.length, local.length));
      setNotice(data.warning ?? data.error ?? "");
    } catch {
      if (isStale()) return;
      const filtered = q.trim()
        ? local.filter((u) =>
            [u.email, u.full_name, u.business_name].join(" ").toLowerCase().includes(q.trim().toLowerCase())
          )
        : local;
      setUsers(filtered);
      setTotal(local.length);
      setNotice("Cloud users unavailable — showing mock accounts registered in this browser.");
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(query), 250);
    return () => window.clearTimeout(t);
  }, [query, load]);

  const sorted = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#0033A0]">Users</h2>
            <p className="mt-1 text-sm text-slate-600">
              Registered accounts. Passwords are never shown.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total users</p>
            <p className="text-2xl font-black text-[#0033A0]">{total}</p>
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search email, phone, name, business…"
          aria-label="Search users"
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-md"
        />
      </header>

      {notice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Refreshing…</p>
      ) : null}

      <div className="space-y-3 md:hidden">
        {sorted.map((user) => (
          <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="font-bold text-slate-900">{user.email || "—"}</p>
            <p className="mt-1 text-sm text-slate-700">{user.phone_number || "No phone"}</p>
            <p className="text-sm text-slate-700">{user.business_name || "—"}</p>
            <p className="text-sm text-slate-500">{user.full_name || "—"}</p>
            <p className="mt-2 text-xs text-slate-500">
              {user.service_category || "—"} · {user.service_area || "—"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Registered {user.created_at ? formatDateDMY(user.created_at) : "—"} · Agreements:{" "}
              {user.agreement_count}
            </p>
          </article>
        ))}
        {!loading && sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No users found.</p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Business</th>
              <th className="px-3 py-3">Full name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Area</th>
              <th className="px-3 py-3">Registered</th>
              <th className="px-3 py-3">Deals</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((user) => (
              <tr key={user.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold">{user.email || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{user.phone_number || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{user.business_name || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{user.full_name || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{user.service_category || "—"}</td>
                <td className="px-3 py-3 text-slate-700">{user.service_area || "—"}</td>
                <td className="px-3 py-3 text-slate-700">
                  {user.created_at ? formatDateDMY(user.created_at) : "—"}
                </td>
                <td className="px-3 py-3 font-semibold">{user.agreement_count}</td>
              </tr>
            ))}
            {!loading && sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
