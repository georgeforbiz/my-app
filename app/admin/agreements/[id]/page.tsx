"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { confirmLocalDeposit } from "@/lib/agreements/admin-confirm-deposit";
import { getLocalAgreement, isLocalAgreementId } from "@/lib/agreements/local-store";
import type { NormalizedAgreement } from "@/lib/agreements/row";
import {
  getVerificationPendingIndexes,
  hasVerificationPending
} from "@/lib/agreements/verification-pending";
import {
  AgreementStatusPill,
  getDerivedAgreementStatus
} from "@/components/agreement-status-pill";
import { formatAMD } from "@/lib/currency";
import { formatDateDMY } from "@/lib/format-date";
import { hasStoredClientSignature, isSignedWithoutSignature } from "@/lib/agreements/status-rank";

export default function AdminAgreementDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [agreement, setAgreement] = useState<NormalizedAgreement | null>(null);
  const [pendingIndexes, setPendingIndexes] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    if (isLocalAgreementId(id)) {
      const row = getLocalAgreement(id);
      setAgreement(row);
      setPendingIndexes(getVerificationPendingIndexes(id));
      setError(row ? "" : "Agreement not found in local store.");
      setLoading(false);
      return;
    }

    try {
      const [agrRes, verRes] = await Promise.all([
        fetch(`/api/admin/agreements/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "same-origin"
        }),
        fetch(`/api/agreement/${encodeURIComponent(id)}/verification`, { cache: "no-store" })
      ]);

      if (agrRes.ok) {
        const data = (await agrRes.json()) as { agreement?: NormalizedAgreement; error?: string };
        if (data.agreement) {
          setAgreement(data.agreement);
          setError("");
        } else {
          setAgreement(null);
          setError(data.error ?? "Agreement not found.");
        }
      } else {
        // Fallback: try public-ish path via confirm-deposit GET not existing — use local only message
        const local = getLocalAgreement(id);
        if (local) {
          setAgreement(local);
          setPendingIndexes(getVerificationPendingIndexes(id));
          setError("");
        } else {
          setAgreement(null);
          const payload = (await agrRes.json().catch(() => ({}))) as { error?: string };
          setError(payload.error ?? "Agreement not found.");
        }
      }

      const ver = (await verRes.json().catch(() => ({}))) as { indexes?: number[] };
      const localIdx = getVerificationPendingIndexes(id);
      setPendingIndexes([...new Set([...(ver.indexes ?? []), ...localIdx])]);
    } catch {
      const local = getLocalAgreement(id);
      setAgreement(local);
      setPendingIndexes(getVerificationPendingIndexes(id));
      setError(local ? "" : "Agreement not found.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const confirm = async (index: number) => {
    if (!id) return;
    setConfirmingIndex(index);
    setMessage("");
    setError("");

    if (isLocalAgreementId(id)) {
      const result = confirmLocalDeposit(id, index);
      if (!result.ok) {
        setError(result.error);
        setConfirmingIndex(null);
        return;
      }
      setAgreement(result.agreement);
      setPendingIndexes(getVerificationPendingIndexes(id));
      setMessage("Transfer confirmed. Funds are now secured.");
      setConfirmingIndex(null);
      void fetch(`/api/agreement/${encodeURIComponent(id)}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit.confirmed",
          meta: { milestoneIndex: index, local: true }
        })
      }).catch(() => {});
      return;
    }

    try {
      const res = await fetch(`/api/admin/agreements/${encodeURIComponent(id)}/confirm-deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ milestoneIndex: index })
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Failed to confirm transfer.");
        setConfirmingIndex(null);
        return;
      }
      setMessage("Transfer confirmed. Funds are now secured.");
      await reload();
    } catch {
      setError("Failed to confirm transfer.");
    } finally {
      setConfirmingIndex(null);
    }
  };

  if (!id) {
    return <p className="text-sm text-slate-600">Missing agreement id.</p>;
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading agreement…</p>;
  }

  if (!agreement) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-[#0033A0]">Agreement not found</h2>
        <p className="mt-2 text-sm text-slate-600">{error || "This agreement is not available."}</p>
        <Link href="/admin/agreements" className="mt-4 inline-flex text-sm font-bold text-[#0033A0]">
          ← Back to transfers
        </Link>
      </div>
    );
  }

  const derived =
    pendingIndexes.length > 0 && agreement.payment_status === "pending"
      ? "verification_pending"
      : getDerivedAgreementStatus(agreement);
  const milestones = agreement.milestones ?? [];
  const totalPending = pendingIndexes.includes(-1) || hasVerificationPending(agreement.id, -1);
  const signatureMissing = isSignedWithoutSignature(agreement);

  return (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/admin/agreements" className="text-xs font-semibold text-[#0033A0] hover:underline">
              ← Transfer Approvals
            </Link>
            <h2 className="mt-2 text-2xl font-black text-[#0033A0]">{agreement.client_name}</h2>
            <p className="mt-1 text-sm text-slate-600">{agreement.project_title}</p>
          </div>
          <AgreementStatusPill status={derived} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/agreement/${agreement.id}`}
            target="_blank"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Open client link
          </Link>
        </div>
      </header>

      {signatureMissing ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-black">Client signature missing</p>
          <p className="mt-1 leading-relaxed">
            This agreement is marked signed but the signature image was not saved. Send the client their link —
            they can sign again on the same agreement (no new deal needed). The agreement id stays the same.
          </p>
          <p className="mt-2 font-mono text-xs text-amber-900/80">{agreement.id}</p>
        </div>
      ) : hasStoredClientSignature(agreement) ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          Client signature on file
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 md:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</p>
          <p className="mt-1 font-semibold text-slate-900">
            {agreement.business_name || agreement.provider_name || "—"}
          </p>
          <p className="text-sm text-slate-600">{agreement.full_name || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900">
            {formatAMD(Number(agreement.total_price), { maxFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
          <p className="mt-1 font-semibold text-slate-800">{formatDateDMY(agreement.created_at)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment type</p>
          <p className="mt-1 font-semibold capitalize text-slate-800">{agreement.payment_type}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agreement id</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-700">{agreement.id}</p>
        </div>
      </section>

      {milestones.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-slate-900">Total payment</h3>
          <p className="mt-1 text-sm text-slate-600">
            Status:{" "}
            <span className="font-semibold">
              {agreement.payment_status === "escrow_held"
                ? "Funds secured"
                : agreement.payment_status === "released"
                  ? "Released"
                  : totalPending
                    ? "Verification pending"
                    : "Awaiting deposit"}
            </span>
          </p>
          {totalPending && agreement.payment_status === "pending" ? (
            <button
              type="button"
              onClick={() => void confirm(-1)}
              disabled={confirmingIndex === -1}
              className="mt-4 rounded-xl bg-[#0033A0] px-4 py-2.5 text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
            >
              {confirmingIndex === -1 ? "Confirming…" : "Confirm transfer"}
            </button>
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <h3 className="text-lg font-bold text-slate-900">Milestones</h3>
          <ul className="mt-4 space-y-3">
            {milestones.map((m, index) => {
              const awaiting =
                (m.status ?? "pending") === "pending" &&
                (pendingIndexes.includes(index) || hasVerificationPending(agreement.id, index));
              return (
                <li
                  key={`${m.title}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{m.title || `Milestone ${index + 1}`}</p>
                    <p className="font-mono text-sm text-slate-700">
                      {formatAMD(Number(m.amount), { maxFractionDigits: 2 })}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {m.status === "released"
                        ? "Released"
                        : m.status === "escrow_held"
                          ? "Funds secured"
                          : awaiting
                            ? "Verification pending"
                            : "Pending deposit"}
                    </p>
                  </div>
                  {awaiting ? (
                    <button
                      type="button"
                      onClick={() => void confirm(index)}
                      disabled={confirmingIndex === index}
                      className="rounded-xl bg-[#0033A0] px-3 py-2 text-xs font-bold text-white hover:opacity-95 disabled:opacity-60"
                    >
                      {confirmingIndex === index ? "Confirming…" : "Confirm transfer"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
