"use client";

import Link from "next/link";
import { useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { enqueueDbPayload } from "@/lib/demo-queue";
import { prepareCreateDealPayload } from "@/lib/db/prepare-payload";
import type { CreateDealPayload } from "@/lib/db/types";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { createDealCopy } from "@/lib/i18n/page-copy";

export default function CreateDealPage() {
  const { language } = useLanguage();
  const tx = createDealCopy[language];
  const user = useAuthOptional()?.user ?? null;
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmountAMD, setTotalAmountAMD] = useState("");
  const [renovationStages, setRenovationStages] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [contractorEmail, setContractorEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [lastPayload, setLastPayload] = useState<CreateDealPayload | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(totalAmountAMD);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert(tx.alertInvalidAmount);
      return;
    }
    setPending(true);
    const payload = prepareCreateDealPayload({
      projectTitle,
      description,
      totalAmountAMD: amt,
      renovationStages,
      clientName,
      clientEmail,
      contractorEmail: contractorEmail || undefined,
      notes: notes || undefined,
      submittedByEmail: user?.email
    });
    enqueueDbPayload(payload as unknown as Record<string, unknown>);
    setLastPayload(payload);
    setPending(false);
  }

  return (
    <VstahShell
      eyebrow={tx.eyebrow}
      title={tx.title}
      subtitle={tx.subtitle}
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.projectTitle}</label>
          <input
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.projectTitlePh}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.description}</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.descriptionPh}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.totalAmount}</label>
          <input
            required
            type="number"
            min={1}
            value={totalAmountAMD}
            onChange={(e) => setTotalAmountAMD(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="450000"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.milestones}</label>
          <textarea
            required
            rows={3}
            value={renovationStages}
            onChange={(e) => setRenovationStages(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.milestonesPh}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">{tx.yourName}</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">{tx.yourEmail}</label>
            <input
              required
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.contractorEmailOptional}</label>
          <input
            type="email"
            value={contractorEmail}
            onChange={(e) => setContractorEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.notes}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? tx.submitSaving : tx.submit}
        </button>
      </form>

      {lastPayload ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-semibold text-slate-700">{tx.preparedJson}</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="font-semibold underline" style={{ color: NAVY }}>
          {tx.backHome}
        </Link>
      </p>
    </VstahShell>
  );
}
