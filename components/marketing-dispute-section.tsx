"use client";

import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { MarketingSectionHeader } from "@/components/marketing-section-header";
import { NAVY } from "@/lib/brand";

export function MarketingDisputeSection({
  disputeEyebrow,
  disputeTitle,
  disputeBody,
  btnStartProtected,
  badge24h,
  badge24hSub,
  badgeLaw,
  badgeLawSub,
  badgeMed,
  badgeMedSub,
  isHy
}: {
  disputeEyebrow: string;
  disputeTitle: string;
  disputeBody: string;
  btnStartProtected: string;
  badge24h: string;
  badge24hSub: string;
  badgeLaw: string;
  badgeLawSub: string;
  badgeMed: string;
  badgeMedSub: string;
  isHy: boolean;
}) {
  const badges = [
    { main: badge24h, sub: badge24hSub },
    { main: badgeLaw, sub: badgeLawSub },
    { main: badgeMed, sub: badgeMedSub }
  ] as const;

  return (
    <section id="dispute" className="scroll-mt-28 border-t border-slate-100 bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-12 md:gap-6 lg:gap-8">
          <article className="relative md:col-span-5 md:row-span-2 lg:col-span-5">
            <Reveal>
              <div className="vstah-soft-shadow-lg relative bg-[#FAFBFC] p-6 sm:p-8 lg:p-10">
                <MarketingSectionHeader eyebrow={disputeEyebrow} title={disputeTitle} subtitle={disputeBody} />
                <Link
                  href="/register?next=%2Fdashboard"
                  className="mt-8 inline-flex w-full items-center justify-center bg-[#E30A17] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#c40914] sm:mt-10"
                >
                  {btnStartProtected}
                </Link>
              </div>
            </Reveal>
          </article>

          <article className="md:col-span-7 md:col-start-6 lg:col-span-7 lg:col-start-6 lg:-mt-8">
            <Reveal delay={50}>
              <div className="vstah-soft-shadow-feature bg-white p-6 sm:p-8 lg:p-10">
                <div className="space-y-2">
                  {badges.map(({ main, sub }) => (
                    <div key={main} className="bg-[#FAFBFC] px-4 py-4 sm:px-5">
                      <h3
                        className={`whitespace-pre-line font-bold leading-snug [overflow-wrap:anywhere] ${
                          isHy ? "text-sm sm:text-[15px]" : "text-[15px] sm:text-base"
                        }`}
                        style={{ color: NAVY }}
                      >
                        {main}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </article>
        </div>
      </div>
    </section>
  );
}
