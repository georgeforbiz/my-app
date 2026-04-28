"use client";

import Link from "next/link";
import { useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { enqueueDbPayload } from "@/lib/demo-queue";
import { prepareProtectProjectPayload } from "@/lib/db/prepare-payload";
import type { ProtectProjectPayload } from "@/lib/db/types";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { protectCopy } from "@/lib/i18n/page-copy";

export default function ProtectProjectPage() {
  const { language } = useLanguage();
  const tx = protectCopy[language];
  const user = useAuthOptional()?.user ?? null;
  const [homeownerEmail, setHomeownerEmail] = useState("");
  const [homeownerName, setHomeownerName] = useState("");
  const [contractorInviteEmail, setContractorInviteEmail] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [invitationMessage, setInvitationMessage] = useState("");
  const [lastPayload, setLastPayload] = useState<ProtectProjectPayload | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const payload = prepareProtectProjectPayload({
      homeownerEmail,
      homeownerName: homeownerName || undefined,
      contractorInviteEmail,
      projectSummary,
      invitationMessage: invitationMessage || undefined,
      submittedByEmail: user?.email
    });
    enqueueDbPayload(payload as unknown as Record<string, unknown>);
    setLastPayload(payload);
    setPending(false);
  }

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle} maxWidthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">{tx.yourEmail}</label>
            <input
              required
              type="email"
              value={homeownerEmail}
              onChange={(e) => setHomeownerEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
              placeholder={tx.phEmail}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">{tx.yourNameOptional}</label>
            <input
              value={homeownerName}
              onChange={(e) => setHomeownerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.contractorEmail}</label>
          <input
            required
            type="email"
            value={contractorInviteEmail}
            onChange={(e) => setContractorInviteEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.phContractor}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.projectSummary}</label>
          <textarea
            required
            rows={4}
            value={projectSummary}
            onChange={(e) => setProjectSummary(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.phSummary}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">{tx.invitationMessageOptional}</label>
          <textarea
            rows={3}
            value={invitationMessage}
            onChange={(e) => setInvitationMessage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder={tx.phInvite}
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
