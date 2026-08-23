"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAMD } from "@/lib/currency";
import { formatDateDMY } from "@/lib/format-date";

type ActivityEvent = {
  id: string;
  created_at: string;
  actor_type: string;
  actor_id: string | null;
  action: string;
  agreement_id: string | null;
  meta: Record<string, unknown> | null;
};

type Derived = {
  recentUsers: Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    business_name: string | null;
    created_at: string;
  }>;
  recentAgreements: Array<{
    id: string;
    client_name: string;
    project_title: string;
    status: string;
    payment_status: string;
    created_at: string;
    total_price: number;
  }>;
};

const ACTION_LABELS: Record<string, string> = {
  "user.registered": "User registered",
  "agreement.created": "Agreement created",
  "agreement.signed": "Agreement signed",
  "deposit.submitted": "Transfer submitted",
  "deposit.confirmed": "Transfer confirmed by admin",
  "payment.released": "Payment released",
  "agreement.completed": "Agreement completed"
};

export default function AdminActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [derived, setDerived] = useState<Derived | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/activity", {
          cache: "no-store",
          credentials: "same-origin"
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          warning?: string;
          events?: ActivityEvent[];
          derived?: Derived;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load activity.");
          return;
        }
        setEvents(data.events ?? []);
        setDerived(data.derived ?? null);
        setWarning(data.warning ?? "");
        setError("");
      } catch {
        if (!cancelled) setError("Failed to load activity.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h2 className="text-2xl font-black text-[#0033A0]">Activity</h2>
        <p className="mt-1 text-sm text-slate-600">
          Live event feed from now on, plus recent users and agreements already in the database.
        </p>
      </header>

      {warning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading activity…</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h3 className="text-lg font-bold text-slate-900">Event feed</h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No logged events yet. New registrations, deals, transfers, and releases will appear here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {ACTION_LABELS[event.action] ?? event.action}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {event.actor_type}
                    {event.actor_id ? ` · ${event.actor_id}` : ""}
                    {event.agreement_id ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/agreements/${event.agreement_id}`}
                          className="font-semibold text-[#0033A0] hover:underline"
                        >
                          open deal
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  {event.created_at ? formatDateDMY(event.created_at) : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-slate-900">Recent users</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {(derived?.recentUsers ?? []).map((u) => (
              <li key={u.id} className="py-2.5">
                <p className="font-semibold text-slate-900">{u.email || "—"}</p>
                <p className="text-xs text-slate-500">
                  {u.business_name || u.full_name || "—"} ·{" "}
                  {u.created_at ? formatDateDMY(u.created_at) : "—"}
                </p>
              </li>
            ))}
            {(derived?.recentUsers ?? []).length === 0 ? (
              <li className="py-3 text-sm text-slate-500">No users yet.</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-slate-900">Recent agreements</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {(derived?.recentAgreements ?? []).map((a) => (
              <li key={a.id} className="py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{a.client_name}</p>
                    <p className="text-xs text-slate-500">
                      {a.project_title} · {a.status}/{a.payment_status} ·{" "}
                      {formatAMD(Number(a.total_price), { maxFractionDigits: 2 })}
                    </p>
                  </div>
                  <Link
                    href={`/admin/agreements/${a.id}`}
                    className="text-xs font-bold text-[#0033A0] hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
            {(derived?.recentAgreements ?? []).length === 0 ? (
              <li className="py-3 text-sm text-slate-500">No agreements yet.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </>
  );
}
