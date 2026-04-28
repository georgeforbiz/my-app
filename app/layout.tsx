import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { LANG_COOKIE } from "@/lib/i18n/constants";
import { SITE_METADATA } from "@/lib/i18n/site-metadata";
import { RootProviders } from "./root-providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: SITE_METADATA.en.title,
  description: SITE_METADATA.en.description
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get(LANG_COOKIE)?.value;
  const htmlLang =
    cookieLang === "hy" || cookieLang === "ru" ? cookieLang : ("en" as const);

  return (
    <html lang={htmlLang} suppressHydrationWarning className="scroll-smooth">
      <body className={`${inter.variable} min-h-screen bg-white font-sans text-slate-800 antialiased`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
