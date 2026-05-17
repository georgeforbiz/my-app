"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { dealPageCopy } from "@/lib/i18n/page-copy";

type DealStatus = "pending_deposit" | "funds_secured" | "payment_requested" | "completed" | "draft";

type Deal = {
  id: string;
  client_name: string;
  project_title: string;
  total_price: number;
  terms: string;
  status: DealStatus;
  created_at: string;
};

export default function DealClientPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const supabase = getSupabaseBrowser();
  const { language } = useLanguage();
  const tx = dealPageCopy[language];

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const badgeStyle: Record<DealStatus, string> = {
    draft: "border-slate-200 bg-slate-100 text-slate-700",
    pending_deposit: "border-slate-200 bg-slate-100 text-slate-700",
    funds_secured: "border-blue-200 bg-blue-100 text-[#0033A0]",
    payment_requested: "border-orange-200 bg-orange-100 text-orange-800",
    completed: "border-emerald-200 bg-emerald-100 text-emerald-800"
  };

  const statusLabel = (status: DealStatus) => {
    if (status === "pending_deposit") return tx.statusPendingDeposit;
    if (status === "funds_secured") return tx.statusFundsSecured;
    if (status === "payment_requested") return tx.statusPaymentRequested;
    if (status === "completed") return tx.statusCompleted;
    return tx.statusDraft;
  };

  const canApprove = deal?.status === "funds_secured" || deal?.status === "payment_requested";

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      if (!supabase) {
        setError(tx.supabaseNotConfigured);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("deals")
        .select("id, client_name, project_title, total_price, terms, status, created_at")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError(tx.notFound);
        setLoading(false);
        return;
      }

      setDeal(data as Deal);
      setLoading(false);
    };

    void run();
  }, [id, supabase, tx.supabaseNotConfigured, tx.notFound]);

  useEffect(() => {
    if (!supabase || !id) return;

    const channel = supabase
      .channel(`deal-page-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deals", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) {
            setDeal(payload.new as Deal);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, id]);

  useEffect(() => {
    if (!toast) return;
    const tm = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(tm);
  }, [toast]);

  const approveAndRelease = async () => {
    if (!id || !supabase || !canApprove || approving) return;

    const confirmed = window.confirm(tx.approveConfirm);
    if (!confirmed) return;

    setApproving(true);
    const { error: updateError } = await supabase.from("deals").update({ status: "completed" }).eq("id", id);

    if (updateError) {
      setError(tx.approveFailed);
      setApproving(false);
      return;
    }

    setDeal((prev) => (prev ? { ...prev, status: "completed" } : prev));
    setToast(tx.toastApproved);
    setApproving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] p-6 text-slate-700">
        {tx.loading}
      </main>
    );
  }

  if (error || !deal) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] p-6 text-red-700">
        {error || tx.notFound}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-black text-[#0033A0]">{tx.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{tx.intro}</p>

        <div className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <span className="font-semibold">{tx.agreementId}</span> {deal.id}
          </p>
          <p>
            <span className="font-semibold">{tx.client}</span> {deal.client_name}
          </p>
          <p>
            <span className="font-semibold">{tx.project}</span> {deal.project_title}
          </p>
          <p>
            <span className="font-semibold">{tx.total}</span>{" "}
            {Number(deal.total_price).toLocaleString(language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "hy-AM")}{" "}
            ֏
          </p>
          <p>
            <span className="font-semibold">{tx.status}</span>{" "}
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeStyle[deal.status]}`}>
              {statusLabel(deal.status)}
            </span>
          </p>
          <p>
            <span className="font-semibold">{tx.created}</span> {new Date(deal.created_at).toLocaleString()}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{tx.terms}</p>
          <p className="mt-2 whitespace-pre-wrap">{deal.terms}</p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">{tx.paymentInstructions}</p>
          <p className="mt-1">{tx.paymentInstructionsBody}</p>
        </div>

        {canApprove ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void approveAndRelease()}
              disabled={approving}
              className="w-full rounded-xl bg-[#F2A800] px-5 py-4 text-base font-black text-slate-900 shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {approving ? tx.approving : tx.approveRelease}
            </button>
          </div>
        ) : null}
      </div>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </main>
  );
}
