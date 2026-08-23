"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AgreementStatusPill } from "@/components/agreement-status-pill";
import { listLocalAgreements } from "@/lib/agreements/local-store";
import type { NormalizedAgreement } from "@/lib/agreements/row";
import {
  hasVerificationPending,
  listVerificationPendingAgreementIds
} from "@/lib/agreements/verification-pending";
import { formatAMD } from "@/lib/currency";
import { formatDateDMY } from "@/lib/format-date";

type CloudPending = {
  agreement_id: string;
  milestone_index: number;
  submitted_at: string;
  client_name: string;
  project_title: string;
  provider_label?: string;
  total_price: number;
};

type Row = {
  id: string;
  client_name: string;
  project_title: string;
  provider_label: string;
  total_price: number;
  created_at: string;
  source: "cloud" | "local";
};

export default function AdminAgreementsPage() {
  const [cloud, setCloud] = useState<CloudPending[]>([]);
  const [localAgreements, setLocalAgreements] = useState<NormalizedAgreement[]>([]);
  const [orphanLocal, setOrphanLocal] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const agreements = listLocalAgreements();
    setLocalAgreements(agreements);

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/admin/transfers", { cache: "no-store", credentials: "same-origin" });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          transfers?: CloudPending[];
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load pending transfers.");
          return;
        }
        const transfers = data.transfers ?? [];
        setCloud(transfers);
        setError(data.error ?? "");

        // Pending cloud UUIDs may sit only in this browser's localStorage.
        // Resolve them even when they are not in the local agreement store.
        const known = new Set([
          ...agreements.map((a) => a.id),
          ...transfers.map((t) => t.agreement_id)
        ]);
        const orphanIds = listVerificationPendingAgreementIds().filter((id) => !known.has(id));
        if (orphanIds.length === 0) {
          if (!cancelled) setOrphanLocal([]);
          return;
        }

        const resolved = await Promise.all(
          orphanIds.map(async (id) => {
            try {
              const agrRes = await fetch(`/api/admin/agreements/${encodeURIComponent(id)}`, {
                cache: "no-store",
                credentials: "same-origin"
              });
              if (agrRes.ok) {
                const payload = (await agrRes.json()) as { agreement?: NormalizedAgreement };
                if (payload.agreement) {
                  const a = payload.agreement;
                  return {
                    id: a.id,
                    client_name: a.client_name,
                    project_title: a.project_title,
                    provider_label: a.business_name || a.provider_name || a.full_name || "—",
                    total_price: Number(a.total_price),
                    created_at: a.created_at,
                    source: "local" as const
                  } satisfies Row;
                }
              }
            } catch {
              // ignore and fall through to placeholder
            }
            return {
              id,
              client_name: "Pending transfer",
              project_title: id.startsWith("local-") ? "Local demo deal" : "Cloud deal",
              provider_label: "—",
              total_price: 0,
              created_at: "",
              source: "local" as const
            } satisfies Row;
          })
        );
        if (!cancelled) setOrphanLocal(resolved);
      } catch {
        if (!cancelled) setError("Failed to load pending transfers.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    const localIds = new Set(listVerificationPendingAgreementIds());
    const localRows: Row[] = localAgreements
      .filter((a) => hasVerificationPending(a.id) || localIds.has(a.id))
      .map((a) => ({
        id: a.id,
        client_name: a.client_name,
        project_title: a.project_title,
        provider_label: a.business_name || a.provider_name || a.full_name || "—",
        total_price: Number(a.total_price),
        created_at: a.created_at,
        source: "local" as const
      }));

    const cloudRows: Row[] = cloud.map((c) => ({
      id: c.agreement_id,
      client_name: c.client_name,
      project_title: c.project_title,
      provider_label: c.provider_label || "—",
      total_price: c.total_price,
      created_at: c.submitted_at,
      source: "cloud" as const
    }));

    const byId = new Map<string, Row>();
    for (const r of [...cloudRows, ...localRows, ...orphanLocal]) {
      if (!byId.has(r.id)) byId.set(r.id, r);
    }
    return [...byId.values()];
  }, [cloud, localAgreements, orphanLocal]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) =>
      [item.client_name, item.project_title, item.provider_label, item.id].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <h2 className="text-2xl font-black text-[#0033A0]">Transfer Approvals</h2>
        <p className="mt-1 text-sm text-slate-600">
          Review bank transfers submitted by clients and confirm received funds.
        </p>
        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, provider, project…"
            aria-label="Search transfers"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-sm"
          />
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="space-y-3 md:hidden">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="font-bold text-slate-900">{item.client_name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.project_title}</p>
            <p className="mt-2 font-mono text-sm font-semibold">
              {formatAMD(Number(item.total_price), { maxFractionDigits: 2 })}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AgreementStatusPill status="verification_pending" />
              <Link
                href={`/admin/agreements/${item.id}`}
                className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700"
              >
                Review
              </Link>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No transfers are waiting for approval.</p>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-3">Client</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3">Amount</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                <td className="px-3 py-3 text-slate-700">{item.provider_label}</td>
                <td className="px-3 py-3 font-mono font-semibold">
                  {formatAMD(Number(item.total_price), { maxFractionDigits: 2 })}
                </td>
                <td className="px-3 py-3 text-slate-700">
                  {item.created_at ? formatDateDMY(item.created_at) : "—"}
                </td>
                <td className="px-3 py-3">
                  <AgreementStatusPill status="verification_pending" />
                </td>
                <td className="px-3 py-3">
                  <Link
                    href={`/admin/agreements/${item.id}`}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                  No transfers are waiting for approval.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
