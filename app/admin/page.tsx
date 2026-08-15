"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AgreementStatusPill } from "@/components/agreement-status-pill";
import { listLocalAgreements } from "@/lib/agreements/local-store";
import {
  hasVerificationPending,
  listVerificationPendingAgreementIds
} from "@/lib/agreements/verification-pending";
import { listMockUsers } from "@/lib/auth/mock-storage";
import { formatAMD } from "@/lib/currency";

type PendingTransfer = {
  agreement_id: string;
  milestone_index: number;
  submitted_at: string;
  client_name: string;
  project_title: string;
  total_price: number;
};

type Stats = {
  users: number;
  agreements: number;
  pending: number;
  signed: number;
  fundsSecured: number;
  completed: number;
  pendingVerification: number;
  pendingTransfers: PendingTransfer[];
};

const EMPTY_STATS: Stats = {
  users: 0,
  agreements: 0,
  pending: 0,
  signed: 0,
  fundsSecured: 0,
  completed: 0,
  pendingVerification: 0,
  pendingTransfers: []
};

function localStats(): Stats {
  const agreements = listLocalAgreements();
  const users = listMockUsers().length;
  const pendingIds = new Set(listVerificationPendingAgreementIds());
  const pendingTransfers: PendingTransfer[] = [];

  for (const a of agreements) {
    if (!hasVerificationPending(a.id) && !pendingIds.has(a.id)) continue;
    pendingTransfers.push({
      agreement_id: a.id,
      milestone_index: -1,
      submitted_at: a.created_at,
      client_name: a.client_name,
      project_title: a.project_title,
      total_price: Number(a.total_price)
    });
  }

  return {
    users,
    agreements: agreements.length,
    pending: agreements.filter((a) => a.status === "pending").length,
    signed: agreements.filter((a) => a.status === "signed").length,
    fundsSecured: agreements.filter((a) => a.payment_status === "escrow_held").length,
    completed: agreements.filter(
      (a) => a.status === "completed" || a.payment_status === "released"
    ).length,
    pendingVerification: pendingTransfers.length,
    pendingTransfers
  };
}

function mergeStats(cloud: Stats, local: Stats): Stats {
  const byId = new Map<string, PendingTransfer>();
  for (const t of [...cloud.pendingTransfers, ...local.pendingTransfers]) {
    if (!byId.has(t.agreement_id)) byId.set(t.agreement_id, t);
  }
  return {
    users: Math.max(cloud.users, local.users),
    agreements: Math.max(cloud.agreements, local.agreements),
    pending: Math.max(cloud.pending, local.pending),
    signed: Math.max(cloud.signed, local.signed),
    fundsSecured: Math.max(cloud.fundsSecured, local.fundsSecured),
    completed: Math.max(cloud.completed, local.completed),
    pendingVerification: byId.size,
    pendingTransfers: [...byId.values()]
  };
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>(() => localStats());
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = localStats();
    setStats(local);

    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store", credentials: "same-origin" });
        const data = (await res.json().catch(() => ({}))) as Partial<Stats> & {
          error?: string;
          warning?: string;
          source?: string;
        };

        const cloud: Stats = {
          users: Number(data.users ?? 0),
          agreements: Number(data.agreements ?? 0),
          pending: Number(data.pending ?? 0),
          signed: Number(data.signed ?? 0),
          fundsSecured: Number(data.fundsSecured ?? 0),
          completed: Number(data.completed ?? 0),
          pendingVerification: Number(data.pendingVerification ?? 0),
          pendingTransfers: Array.isArray(data.pendingTransfers) ? data.pendingTransfers : []
        };

        const cloudEmpty =
          cloud.users === 0 &&
          cloud.agreements === 0 &&
          cloud.pendingTransfers.length === 0;

        if (!res.ok || data.source === "empty" || cloudEmpty) {
          setStats(mergeStats(cloud, local));
          setNotice(
            data.warning ||
              data.error ||
              (cloudEmpty
                ? "Cloud data unavailable — showing local demo data from this browser."
                : "")
          );
        } else {
          setStats(mergeStats(cloud, local));
          setNotice(data.warning ?? "");
        }
      } catch {
        setStats(local);
        setNotice("Cloud data unavailable — showing local demo data from this browser.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Agreements", value: stats.agreements },
    { label: "Pending verification", value: stats.pendingVerification },
    { label: "Funds secured", value: stats.fundsSecured },
    { label: "Completed / released", value: stats.completed },
    { label: "Signed deals", value: stats.signed }
  ];

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#0033A0]">Stats</h2>
            <p className="mt-1 text-sm text-slate-600">
              Counts from Supabase when available, plus local demo deals in this browser.
            </p>
          </div>
          {loading ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Refreshing…</p>
          ) : null}
        </div>
      </header>

      {notice ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-black text-[#0033A0] ${loading ? "opacity-50" : ""}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">Transfers waiting for approval</h3>
          <Link href="/admin/agreements" className="text-sm font-semibold text-[#0033A0] hover:underline">
            Review transfers
          </Link>
        </div>
        {stats.pendingTransfers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No transfers are waiting for approval.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {stats.pendingTransfers.map((item) => (
              <li
                key={`${item.agreement_id}-${item.milestone_index}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{item.client_name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.project_title} ·{" "}
                    {formatAMD(Number(item.total_price), { maxFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AgreementStatusPill status="verification_pending" />
                  <Link
                    href={`/admin/agreements/${item.agreement_id}`}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
