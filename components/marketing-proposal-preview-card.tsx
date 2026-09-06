"use client";

import { useEffect, useMemo, useRef } from "react";
import { Battery, Signal, Wifi } from "lucide-react";
import {
  AgreementDocumentView,
  type AgreementDocumentData
} from "@/components/agreement-document-view";
import type { Language } from "@/lib/i18n/locales";

export type ProposalPreviewCopy = {
  projectLabel: string;
  projectId: string;
  projectTitle: string;
  heroProposalStatus: string;
  heroProposalLabel: string;
  heroMilestonesLabel: string;
  stage1Name: string;
  stage1Amount: string;
  heroStage1Status: string;
  stage2Name: string;
  stage2Amount: string;
  heroStage2Status: string;
  stage3Name: string;
  stage3Amount: string;
  heroStage3Status: string;
  heroSignatureName: string;
  heroDigitallyVerified: string;
  heroTapToSignHint: string;
  heroSignatureLabel: string;
  heroSignCta: string;
  heroRow1Badge: string;
  heroAuditTrail: string;
  heroProposalMockupAria: string;
  demoProviderDetails: string;
  demoClientDetails: string;
  demoBusinessName: string;
  demoClientName: string;
  demoBusinessPhone: string;
  demoClientPhone: string;
  demoTotalLabel: string;
  demoTotalAmount: string;
  demoTermsTitle: string;
  demoTermsBody: string;
  demoScrollHint: string;
  demoOfferLabel: string;
  demoAgreementTitle: string;
  demoSignedSubtitle: string;
  demoProjectHeader: string;
  demoBusinessNameLabel: string;
  demoClientNameLabel: string;
  demoPhoneLabel: string;
  demoPaymentSchedule: string;
  demoScheduleStatus: string;
  demoStatusSigned: string;
  demoClientSignature: string;
};

function parseDramAmount(value: string): number {
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Scrollable, already-signed agreement demo inside the original phone frame size. */
export function MarketingAgreementDemo({
  t,
  locale
}: {
  t: ProposalPreviewCopy;
  locale: Language;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchY = useRef(0);
  const touchVel = useRef(0);
  const touchTime = useRef(0);
  const chaining = useRef(false);
  const rafId = useRef(0);
  const smoothTimer = useRef(0);
  const lastScrollTop = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollVel = useRef(0);
  const transferring = useRef(false);

  const demoAgreement = useMemo<AgreementDocumentData>(() => {
    const milestones = [
      { title: t.stage1Name, amount: parseDramAmount(t.stage1Amount) },
      { title: t.stage2Name, amount: parseDramAmount(t.stage2Amount) },
      { title: t.stage3Name, amount: parseDramAmount(t.stage3Amount) }
    ];
    const totalFromMilestones = milestones.reduce((sum, m) => sum + m.amount, 0);
    const total = parseDramAmount(t.demoTotalAmount) || totalFromMilestones;

    return {
      id: "am2841-0000-4000-8000-000000000001",
      created_at: "2026-03-15T10:00:00.000Z",
      status: "signed",
      business_name: t.demoBusinessName,
      provider_phone: t.demoBusinessPhone,
      provider_email: "hello@buildpro.am",
      client_name: t.demoClientName,
      client_phone: t.demoClientPhone,
      client_email: "anahit@email.com",
      project_title: t.projectTitle,
      service_area: "Yerevan",
      custom_terms: t.demoTermsBody,
      total_price: total,
      vat_mode: "included",
      payment_type: "milestones",
      milestones,
      client_signature: "/marketing/signature-mark.svg"
    };
  }, [t]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const html = document.documentElement;
    let smoothOff = false;
    const EPS = 1.5;

    const suppressPageSmooth = () => {
      if (smoothOff) return;
      html.classList.remove("scroll-smooth");
      smoothOff = true;
    };

    const restorePageSmooth = () => {
      if (!smoothOff) return;
      html.classList.add("scroll-smooth");
      smoothOff = false;
    };

    const scheduleRestoreSmooth = () => {
      window.clearTimeout(smoothTimer.current);
      smoothTimer.current = window.setTimeout(restorePageSmooth, 160);
    };

    const scrollPageBy = (dy: number) => {
      if (dy === 0) return;
      suppressPageSmooth();
      const root = document.scrollingElement ?? html;
      root.scrollTop += dy;
    };

    const atTop = () => el.scrollTop <= EPS;
    const atBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - EPS;

    /** Desktop: own the wheel so leftovers spill to the page in one motion. */
    const applyWheelDelta = (dy: number) => {
      if (dy === 0) return;

      if (dy > 0) {
        const room = Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop);
        if (room > 0.5) {
          const used = Math.min(room, dy);
          el.scrollTop += used;
          scrollPageBy(dy - used);
        } else {
          scrollPageBy(dy);
        }
      } else {
        const up = -dy;
        const room = el.scrollTop;
        if (room > 0.5) {
          const used = Math.min(room, up);
          el.scrollTop -= used;
          scrollPageBy(-(up - used));
        } else {
          scrollPageBy(dy);
        }
      }
    };

    const flingPage = (pxPerFrame: number) => {
      cancelAnimationFrame(rafId.current);
      let v = pxPerFrame;
      transferring.current = true;
      const tick = () => {
        v *= 0.94;
        if (Math.abs(v) < 0.4) {
          transferring.current = false;
          scheduleRestoreSmooth();
          return;
        }
        scrollPageBy(v);
        rafId.current = requestAnimationFrame(tick);
      };
      rafId.current = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const now = performance.now();
      const st = el.scrollTop;
      const dt = Math.max(1, now - lastScrollTime.current);
      scrollVel.current = (st - lastScrollTop.current) / dt;
      lastScrollTop.current = st;
      lastScrollTime.current = now;

      if (!transferring.current && !chaining.current && atBottom() && scrollVel.current > 0.12) {
        flingPage(Math.min(scrollVel.current * 18, 48));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= el.clientHeight;

      applyWheelDelta(dy);
      scheduleRestoreSmooth();
    };

    const onTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(rafId.current);
      window.clearTimeout(smoothTimer.current);
      transferring.current = false;
      chaining.current = false;
      touchY.current = e.touches[0]?.clientY ?? 0;
      touchTime.current = performance.now();
      touchVel.current = 0;
      lastScrollTop.current = el.scrollTop;
      lastScrollTime.current = performance.now();
      scrollVel.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      const now = performance.now();
      const dy = touchY.current - y;
      const dt = Math.max(8, now - touchTime.current);
      touchVel.current = touchVel.current * 0.5 + (dy / dt) * 0.5;

      const goingDown = dy > 0;
      const goingUp = dy < 0;
      const hitBottom = goingDown && atBottom();
      const hitTop = goingUp && atTop();

      if (hitBottom || hitTop || chaining.current) {
        if ((goingDown && atBottom()) || (goingUp && atTop())) {
          chaining.current = true;
          e.preventDefault();
          scrollPageBy(dy);
        } else {
          chaining.current = false;
        }
      }

      touchY.current = y;
      touchTime.current = now;
    };

    const onTouchEnd = () => {
      if (chaining.current && Math.abs(touchVel.current) > 0.05) {
        flingPage(Math.sign(touchVel.current) * Math.min(Math.abs(touchVel.current) * 18, 48));
      } else {
        scheduleRestoreSmooth();
      }
      chaining.current = false;
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      cancelAnimationFrame(rafId.current);
      window.clearTimeout(smoothTimer.current);
      restorePageSmooth();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div className="w-full" aria-label={t.heroProposalMockupAria}>
      <div className="relative mx-auto flex min-h-[380px] w-full max-w-[420px] items-center justify-center py-8 sm:min-h-[420px] sm:max-w-[460px] sm:py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
          <div className="absolute h-[min(100%,420px)] w-[min(100%,420px)] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute h-[72%] w-[72%] rounded-full bg-[#F2A800]/12 blur-2xl" />
          <div className="absolute h-[88%] w-[88%] rounded-full border border-white/10" />
          <div className="absolute h-[68%] w-[68%] rounded-full border border-dashed border-white/15" />
          <div className="absolute left-[14%] top-[18%] h-2 w-2 rounded-full bg-[#F2A800]/70 blur-[1px]" />
          <div className="absolute right-[16%] top-[24%] h-1.5 w-1.5 rounded-full bg-white/50" />
          <div className="absolute bottom-[20%] left-[22%] h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>

        <div className="relative w-full max-w-[300px] sm:max-w-[320px]">
          <div className="relative rounded-[2.75rem] bg-gradient-to-b from-slate-700 via-slate-900 to-black p-[10px] shadow-[0_28px_56px_-14px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
            <span className="absolute -left-[3px] top-[84px] h-7 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -left-[3px] top-[124px] h-10 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -left-[3px] top-[168px] h-10 w-[3px] rounded-l-sm bg-slate-600" aria-hidden />
            <span className="absolute -right-[3px] top-[116px] h-14 w-[3px] rounded-r-sm bg-slate-600" aria-hidden />

            <div className="relative overflow-hidden rounded-[2.2rem] bg-black ring-1 ring-white/10">
              <div className="relative z-[2] bg-white px-4 pb-1.5 pt-3">
                <div
                  className="absolute left-1/2 top-2 z-10 h-[25px] w-[92px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  aria-hidden
                />
                <div className="relative z-[1] flex items-center justify-between px-1 text-[11px] font-semibold tracking-tight text-slate-900">
                  <span>9:41</span>
                  <span className="flex items-center gap-1">
                    <Signal className="h-3 w-3" strokeWidth={2.5} />
                    <Wifi className="h-3 w-3" strokeWidth={2.5} />
                    <Battery className="h-3.5 w-4" strokeWidth={2} />
                  </span>
                </div>
              </div>

              {/* Fixed screen height — never depends on translated copy or font metrics */}
              <div className="relative h-[520px] shrink-0 bg-slate-100 font-sans">
                <div
                  ref={scrollRef}
                  className="absolute inset-0 overflow-hidden overscroll-none bg-white [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]"
                  style={{ touchAction: "pan-y" }}
                  tabIndex={0}
                  role="region"
                  aria-label={t.demoScrollHint}
                >
                  <div className="h-full">
                    <AgreementDocumentView agreement={demoAgreement} lang={locale} embedded compact closingOnly />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] flex justify-center">
                    <div className="h-[5px] w-[118px] rounded-full bg-slate-900/20" aria-hidden />
                  </div>
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 rounded-[2.2rem] bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-20"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const MarketingProposalPreviewCard = MarketingAgreementDemo;
