import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { VstahLogo } from "@/components/vstah-logo";

export function MarketingFooter({
  t
}: {
  t: {
    brand: string;
    footerTagline: string;
    footerCompany: string;
    footerLegal: string;
    footerFollow: string;
    footerRights: string;
    footerTerms: string;
    footerPrivacy: string;
    navHome: string;
    navHowItWorks: string;
    navPricing: string;
  };
}) {
  return (
    <footer className="bg-[#FAFBFC] text-slate-600">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6 md:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr] lg:gap-8">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <VstahLogo size={32} alt="VSTAH logo" className="h-8 w-8" />
              <span className="text-base font-semibold tracking-tight text-slate-900">{t.brand}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{t.footerTagline}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.footerCompany}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-slate-600 transition hover:text-slate-900">
                  {t.navHome}
                </Link>
              </li>
              <li>
                <Link href="/#difference" className="text-slate-600 transition hover:text-slate-900">
                  {t.navHowItWorks}
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-slate-600 transition hover:text-slate-900">
                  {t.navPricing}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.footerLegal}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="text-slate-600 transition hover:text-slate-900">
                  {t.footerTerms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 transition hover:text-slate-900">
                  {t.footerPrivacy}
                </Link>
              </li>
            </ul>
          </div>

          <div className="sm:text-right lg:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.footerFollow}</p>
            <div className="mt-4 flex items-center gap-4 sm:justify-end">
              <a
                href="https://instagram.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-800"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-800"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-12 border-t border-slate-200/80 pt-6 text-xs text-slate-400">{t.footerRights}</p>
      </div>
    </footer>
  );
}
