import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Caveat, Great_Vibes, Inter } from "next/font/google";
import "./globals.css";
import { LANG_COOKIE } from "@/lib/i18n/constants";
import type { Language } from "@/lib/i18n/locales";
import { SITE_DESCRIPTION, SITE_METADATA } from "@/lib/i18n/site-metadata";
import { RootProviders } from "./root-providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["500", "600", "700"],
  display: "swap"
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-signature",
  weight: "400",
  display: "swap"
});

const siteTitle = SITE_METADATA.en.title;

export const metadata: Metadata = {
  title: siteTitle,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: siteTitle,
    description: SITE_DESCRIPTION,
    siteName: "VSTAH",
    type: "website",
    locale: "en"
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: SITE_DESCRIPTION
  }
};

/** Device-width scaling + safe-area support for notched iPhones (pairs with global overflow-x rules). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;
  const htmlLang: Language =
    cookieLang === "hy" || cookieLang === "ru" ? cookieLang : "en";

  return (
    <html lang={htmlLang} suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${inter.variable} ${caveat.variable} ${greatVibes.variable} min-h-screen min-w-0 w-full max-w-full overflow-x-clip bg-white font-sans text-slate-800 antialiased`}
      >
        <noscript>
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              fontFamily: "system-ui,sans-serif"
            }}
          >
            <p>
              JavaScript is required for VSTAH. Enable it, then reload{" "}
              <Link href="/">the homepage</Link>.
            </p>
          </div>
        </noscript>
        <div className="site-root min-h-screen min-w-0 w-full max-w-full overflow-x-clip">
          <RootProviders initialLanguage={htmlLang}>{children}</RootProviders>
        </div>
      </body>
    </html>
  );
}
