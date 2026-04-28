# MASTER_BACKUP — VSTAH (escrow-platform)

Manual backup to rebuild the Next.js 14 app and Supabase schema. **Do not commit real secrets**; use `.env.local` from `.env.example` on a new machine.

## What this project is

- **Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind, Supabase (Postgres + Auth + Realtime).
- **Primary product flow:** Providers create **agreements** in the dashboard; clients open a **public** `/agreement/[id]` URL to sign, simulate deposit to escrow, and release (or per-milestone).
- **Legacy / demo:** `/deal/[id]` reads a `deals` table (separate from `agreements`). `/create-deal` and `/protect` prepare JSON to localStorage via `lib/demo-queue.ts` (not the main agreements pipeline).

## Rebuild checklist

1. **Node:** LTS; run `npm install` in the project root.
2. **Environment:** Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public).
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; **never** expose to the browser) — required for API routes to update `agreements` when RLS blocks anon updates.
   - `NEXT_PUBLIC_SITE_URL` (no trailing slash) for correct share links when not on the same origin.
3. **Supabase SQL:** In Supabase → SQL, run the migration files **in filename order** (see **Database migrations** below). Reconcile with your live DB: some migrations in this repo are incremental fixes; the **logical model** the app expects is described under **Agreements table (effective)**.
4. **Auth:** Enable Email auth in Supabase. Optional: email confirmation. Without Supabase env vars, `getSupabaseBrowser()` is null and **mock auth** in `lib/auth/mock-storage.ts` is used.
5. **Static assets:** Add `public/logo-vstah-clean.png` (and any other assets referenced by paths) — not duplicated in this file.
6. **Dev / OneDrive:** `next.config.mjs` reduces parallel CPUs and webpack cache in dev to avoid sync-folder issues. Use `npm run dev:clean` or delete `.next` if chunks go stale.
7. **Build:** `npm run build` then `npm start`.

---

## Database: `agreements` (effective model)

The TypeScript source of truth for reads is `normalizeAgreementRow` in `lib/agreements/row.ts`. Columns the UI expects (modern schema):

| Column | Type | Role |
|--------|------|------|
| `id` | uuid | Primary key. |
| `provider_id` | uuid | FK to `auth.users` — logged-in provider who owns the row. |
| `provider_name` | text | Display on agreement PDF. |
| `client_name` | text | Client display name. |
| `project_title` | text | Project / service title. |
| `service_area` | text | Region / service area. |
| `custom_terms` | text | Full contract text shown on the agreement page. |
| `total_price` | numeric | Total in AMD; must be &gt; 0. |
| `payment_type` | `single` \| `milestones` | Single lump vs staged milestones. |
| `milestones` | jsonb | Array of `{ title, amount, status? }`. Status: `pending` → `escrow_held` → `released`. |
| `status` | `pending` \| `signed` \| `completed` | Agreement lifecycle (signature + completion). |
| `payment_status` | `pending` \| `escrow_held` \| `released` | **Escrow** high-level state for single payment; for milestones, `escrow_held` is used while work is in progress; `released` when all milestones are released. |
| `client_signature` | text (optional) | Data URL of drawn signature, set by sign API. |
| `created_at` | timestamptz | Creation time. |

**Legacy columns** (`service_description`, `payment_terms` JSON string) are supported in `normalizeAgreementRow` for older DBs. `payment_status` may also be stored as `paid` in legacy DBs; the app normalizes that to `released`.

### Row Level Security (RLS)

- `20260425_agreements_public_sign_policy.sql` enables **open SELECT + UPDATE** on `agreements` for demo/testing. **Production** should replace this with stricter policies (e.g. public read by id, updates only via service role or signed JWT claims).
- Server routes use `getAgreementServerClient()`: prefers `SUPABASE_SERVICE_ROLE_KEY` to **bypass RLS** for reliable sign/deposit/release.

### `deals` table (optional)

`app/deal/[id]/page.tsx` expects a `deals` table with columns `id, client_name, project_title, total_price, terms, status, created_at`. This is **not** created by the `agreements` migrations in this repo. Either create it separately or ignore that route for a minimal agreements-only deploy.

---

## Escrow system logic (agreements)

This app **simulates** escrow in application state: there is no separate payments processor table. Money movement is represented by `payment_status` and milestone `status` fields.

### State machines

**Agreement `status`**

- `pending` — Created by provider; client has not signed.
- `signed` — Client signed (and optional `client_signature` stored). Payment actions are allowed.
- `completed` — All funds released (single payment fully released, or all milestones `released`).

**Payment `payment_status` (single-payment / whole-deal view)**

- `pending` — No funds marked as in escrow yet.
- `escrow_held` — “Deposit” recorded; funds considered locked.
- `released` — Full payment released; agreement typically moves to `completed`.

**Milestone `status` (when `payment_type = 'milestones'`)**

- `pending` — Not yet “deposited” for that stage.
- `escrow_held` — That stage’s amount is in the vault; client can “Release” to pay out that milestone.
- `released` — That stage is paid out.

### API surface (server)

All POST, JSON body optional except where noted:

| Route | Purpose |
|-------|---------|
| `POST /api/agreement/[id]/sign` | If `status` is `pending`, set `signed`. Optional `{ signature: "data:image/png;base64,..." }` → `client_signature`. |
| `POST /api/agreement/[id]/deposit` | **Single:** body empty; requires `signed` + `payment_status === pending` → set `escrow_held`. **Milestones:** `{ milestoneIndex, confirmOutOfOrder? }` — sets that milestone to `escrow_held` and `payment_status` to `escrow_held`. Returns `409` with `OUT_OF_ORDER` if previous milestone not released and `confirmOutOfOrder` is false. |
| `POST /api/agreement/[id]/release` | **Single:** no `milestoneIndex`; requires `escrow_held` → `released` + `completed`. **Milestones:** `{ milestoneIndex }` — marks milestone `released`; if all released, `payment_status: released`, `status: completed`. **Legacy DB:** release route may write `paid` instead of `released` if the check constraint requires it. |

### Client fallbacks

The agreement page calls APIs first, then on failure may attempt **direct Supabase `.update()`** with the anon key (works only if RLS allows). This is a resilience path when service role is missing; production should rely on the service role + tight RLS.

### Realtime

- Dashboard and agreement page **subscribe** to `agreements` changes so UIs update without full refresh.

---

## Database migrations (file order)

Run in this order in Supabase SQL (or `supabase db push` if you use the CLI with this folder):

1. `20260425_create_agreements.sql` — base table (note: may conflict with a DB that already has different columns; adjust for your base).
2. `20260425_agreements_contract_terms_and_payment_status.sql` — `custom_terms`, `payment_status`, `provider_name`, `service_area`.
3. `20260425_agreements_payment_status_escrow_held.sql` — adds `escrow_held` to the payment_status check.
4. `20260425_agreements_public_sign_policy.sql` — open RLS policies (tighten for prod).
5. `20260426_agreements_fix_missing_columns.sql` — backfill / constraints (drops legacy columns if present; **verify** it matches your need before running on a DB with data you care about).
6. `20260427_agreements_add_milestones.sql` — ensures `milestones` column.

---

## File contents (verbatim)

The following sections contain the full source of each file at backup time. Language tags match file types.



---

### `package.json`

```json
{
  "name": "escrow-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "clean": "node scripts/clean-next.cjs",
    "prebuild": "node scripts/clean-next.cjs",
    "dev": "next dev",
    "dev:clean": "npm run clean && next dev",
    "build": "next build",
    "build:clean": "npm run build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.104.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "lucide-react": "^0.511.0",
    "next": "14.2.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.11",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.3"
  }
}

```


---

### `next.config.mjs`

```text
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fewer parallel workers reduces flaky missing-chunk errors when `.next` lives on
  // a synced folder (OneDrive) or similar file-locking setups.
  experimental: {
    cpus: 1
  },
  async redirects() {
    return [
      // Auth aliases to prevent 404s from old/shared links.
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/sign-in", destination: "/login", permanent: false },
      { source: "/signup", destination: "/register", permanent: false },
      { source: "/sign-up", destination: "/register", permanent: false },
      { source: "/registration", destination: "/register", permanent: false },
      // Legacy deal links now use the agreement route.
      { source: "/deal/:id", destination: "/agreement/:id", permanent: false },
      // Common create-deal variants.
      { source: "/createDeal", destination: "/create-deal", permanent: false },
      { source: "/create_deal", destination: "/create-deal", permanent: false }
    ];
  },
  webpack: (config, { dev }) => {
    // OneDrive-synced folders can intermittently fail webpack pack cache writes.
    // Disable persistent cache in dev to avoid random runtime/build breakages.
    if (dev) {
      config.cache = false;
    }
    return config;
  }
};

export default nextConfig;

```


---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```


---

### `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          blue: "#1D4ED8",
          "blue-soft": "#3B82F6",
          red: "#DC2626",
          "red-hover": "#B91C1C"
        },
        armenia: {
          red: "#D90012",
          blue: "#0033A0",
          gold: "#F2A900",
          cream: "#F7F8FC",
          ink: "#121826"
        },
        vstah: {
          navy: "#003366",
          "navy-dark": "#00264d"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

```


---

### `postcss.config.js`

```text
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};

```


---

### `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals"]
}

```


---

### `.env.example`

```text
# Optional — when set, login/register use Supabase Auth instead of the browser mock.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Public site URL for agreement share links (copy / WhatsApp). No trailing slash. Falls back to the browser origin.
NEXT_PUBLIC_SITE_URL=

# Server-only. Required for client agreement signing and other server routes that must bypass RLS.
# Never expose this key in client-side code or commit it.
SUPABASE_SERVICE_ROLE_KEY=

```


---

### `scripts/clean-next.cjs`

```js
/* Removes .next so the next dev/build starts from a fresh cache. */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", ".next");
try {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("Removed .next");
} catch {
  console.log("No .next to remove (ok)");
}

```


---

### `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootProviders } from "./root-providers";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "VSTAH.am | Building Trust in Every Project",
  description:
    "Armenia's leading safe-deal platform for home and renovation. Protected payments and secure deposits until work is complete."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} min-h-screen bg-white font-sans text-slate-800 antialiased`}>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}

```


---

### `app/root-providers.tsx`

```tsx
"use client";

import type { ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n/language-context";

export function RootProviders({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

```


---

### `app/providers.tsx`

```tsx
"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

```


---

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light;
    --vstah-navy: #003366;
    --vstah-navy-dark: #00264d;
    --vstah-surface: #f8fafc;
  }

  html {
    -webkit-tap-highlight-color: transparent;
    scrollbar-gutter: stable;
  }

  html,
  body {
    margin: 0;
    min-height: 100%;
  }

  h1,
  h2,
  h3 {
    letter-spacing: -0.03em;
  }
}

body {
  min-height: 100vh;
  overflow-x: hidden;
  background: #ffffff;
  color: #0f172a;
  font-feature-settings: "ss01" on, "cv01" on;
}

* {
  box-sizing: border-box;
}

@layer components {
  .vstah-hero-mesh {
    background-color: var(--vstah-navy);
    background-image:
      radial-gradient(ellipse 120% 80% at 0% 0%, rgba(255, 255, 255, 0.14), transparent 45%),
      radial-gradient(ellipse 90% 70% at 100% 20%, rgba(148, 163, 184, 0.12), transparent 50%),
      radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0, 38, 77, 0.85), transparent 55%),
      linear-gradient(165deg, var(--vstah-navy) 0%, #0c2744 40%, #0f172a 100%);
  }

  .vstah-grid-pattern {
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .vstah-card-shine {
    position: relative;
    overflow: hidden;
  }

  .vstah-card-shine::after {
    content: "";
    position: absolute;
    inset: -40% -60% auto 40%;
    height: 200%;
    transform: rotate(18deg);
    background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.12) 50%, transparent 60%);
    pointer-events: none;
  }
}

```


---

### `app/(marketing)/layout.tsx`

```tsx
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

```


---

### `app/(marketing)/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { OrangeButton, OutlineLightButton } from "@/components/vstah-button";
import { NAVY, ORANGE, RED } from "@/lib/brand";
import { useMemo, useState } from "react";
import { useLanguage, type Language } from "@/lib/i18n/language-context";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Facebook,
  FileText,
  Globe,
  Hammer,
  House,
  Instagram,
  Landmark,
  ListOrdered,
  Lock,
  Menu,
  Phone,
  Scale,
  Shield,
  Wallet,
  X
} from "lucide-react";

type Locale = Language;

type ComparisonRow = { label: string; withVstah: string; withoutUs: string };
type ProcessStep = { step: string; title: string; desc: string };

type TranslationBundle = {
  brand: string;
  navHome: string;
  navHowItWorks: string;
  btnCreateDeal: string;
  btnProtectProject: string;
  btnSeeHow: string;
  btnStartProtected: string;
  heroEyebrow: string;
  /** Split headline so the renovation word can be styled (blue + underline). */
  heroTitleBefore: string;
  heroTitleHighlight: string;
  heroTitleAfter: string;
  heroSubtitle: string;
  cardChip1: string;
  cardChip2: string;
  projectLabel: string;
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  fundsLabel: string;
  lockedNote: string;
  stage1Name: string;
  stage1Amount: string;
  stage1State: string;
  stage2Name: string;
  stage2Amount: string;
  stage2State: string;
  stage3Name: string;
  stage3Amount: string;
  stage3State: string;
  cardMediation: string;
  cardTagline1: string;
  cardTagline2: string;
  feature1: string;
  feature2: string;
  feature3: string;
  feature4: string;
  diffEyebrow: string;
  diffTitle: string;
  diffSubtitle: string;
  recommended: string;
  colWith: string;
  colWithout: string;
  comparisonRows: ComparisonRow[];
  processEyebrow: string;
  processTitle: string;
  processSubtitle: string;
  processSteps: ProcessStep[];
  disputeEyebrow: string;
  disputeTitle: string;
  disputeBody: string;
  badge24h: string;
  badge24hSub: string;
  badgeLaw: string;
  badgeLawSub: string;
  badgeMed: string;
  badgeMedSub: string;
  footerTagline: string;
  footerRights: string;
  footerPhoneLabel: string;
  footerTerms: string;
  footerPrivacy: string;
  footerFollow: string;
  tableCategory: string;
};

const translations: Record<Locale, TranslationBundle> = {
  en: {
    brand: "VSTAH.am",
    navHome: "Home",
    navHowItWorks: "How it works",
    btnCreateDeal: "Create Deal",
    btnProtectProject: "Protect My Project",
    btnSeeHow: "See how it works",
    btnStartProtected: "Start a protected project",
    heroEyebrow: "Armenia's escrow platform for home & renovation projects",
    heroTitleBefore: "Protect Your ",
    heroTitleHighlight: "Renovation",
    heroTitleAfter: " in Armenia.",
    heroSubtitle:
      "Don't pay the contractor upfront. Don't start work without a guarantee. VSTAH locks the funds until the work is done.",
    cardChip1: "Escrow-secured deposit",
    cardChip2: "Written work agreement",
    projectLabel: "Project",
    projectId: "#AM-2841",
    projectTitle: "Apartment renovation",
    projectStatus: "Active",
    fundsLabel: "Funds in safe",
    lockedNote: "Locked across 3 stages",
    stage1Name: "Demolition & prep",
    stage1Amount: "150,000 ֏",
    stage1State: "Released",
    stage2Name: "Plumbing & electrical",
    stage2Amount: "200,000 ֏",
    stage2State: "Locked",
    stage3Name: "Final finishing",
    stage3Amount: "100,000 ֏",
    stage3State: "Pending",
    cardMediation: "Funds Secured by Armenian mediation",
    cardTagline1: "Stop the disputes.",
    cardTagline2: "Start the renovation.",
    feature1: "No upfront risk.",
    feature2: "No unpaid work.",
    feature3: "Built in Armenia.",
    feature4: "For Armenian\u00A0homes.",
    diffEyebrow: "The difference",
    diffTitle: "With VSTAH vs. Without Us",
    diffSubtitle:
      "Stop the arguments before they start. Here's why homeowners and contractors choose escrow.",
    recommended: "Recommended",
    colWith: "With VSTAH",
    colWithout: "Without Us",
    comparisonRows: [
      {
        label: "Funds protection",
        withVstah: "Deposit locked in escrow until work approved",
        withoutUs: "Cash handed over, hope for the best"
      },
      {
        label: "Written agreement",
        withVstah: "Digital contract signed by both parties",
        withoutUs: "Verbal promises & WhatsApp messages"
      },
      {
        label: "Renovation stages",
        withVstah: "Pay per completed stage, release on approval",
        withoutUs: "Full payment upfront or dispute after"
      },
      {
        label: "Disputes",
        withVstah: "Armenian legal mediation included",
        withoutUs: "Personal arguments, wasted time & money"
      },
      {
        label: "Transparency",
        withVstah: "Every stage logged & timestamped",
        withoutUs: "Miscommunication & misunderstandings"
      },
      {
        label: "Trust",
        withVstah: "Guaranteed by the platform — not promises",
        withoutUs: "Depends on who you know"
      }
    ],
    processEyebrow: "The process",
    processTitle: "How it works",
    processSubtitle:
      "Four simple steps. Zero guesswork. Both the homeowner and contractor are protected.",
    processSteps: [
      {
        step: "01",
        title: "Create Project Deal",
        desc: "Define the renovation scope, stages, and total cost in minutes."
      },
      {
        step: "02",
        title: "Homeowner Deposits",
        desc: "Funds are locked in escrow. Secure and transparent."
      },
      {
        step: "03",
        title: "Contractor Starts Work",
        desc: "Work begins with full confidence the money is waiting."
      },
      {
        step: "04",
        title: "Approve & Release",
        desc: "Homeowner approves each stage — funds released to contractor."
      }
    ],
    disputeEyebrow: "Dispute resolution",
    disputeTitle: "If something goes wrong, we step in.",
    disputeBody:
      "Our Armenian legal experts mediate when renovation projects get complicated. Fair, fast, and based on local law — so both sides reach a resolution.",
    badge24h: "24h",
    badge24hSub: "Response time",
    badgeLaw: "100%",
    badgeLawSub: "Armenian law",
    badgeMed: "3-step",
    badgeMedSub: "Mediation process",
    footerTagline: "Building Trust in Every Project",
    footerRights: "© 2026 VSTAH.am. All rights reserved.",
    footerPhoneLabel: "Phone",
    footerTerms: "Terms of Service",
    footerPrivacy: "Privacy Policy",
    footerFollow: "Follow us",
    tableCategory: "Topic"
  },
  hy: {
    brand: "VSTAH.am",
    navHome: "Գլխավոր",
    navHowItWorks: "Ինչպես է աշխատում",
    btnCreateDeal: "Ստեղծել գործարք",
    btnProtectProject: "Պաշտպանել նախագիծը",
    btnSeeHow: "Ինչպես է աշխատում",
    btnStartProtected: "Սկսել պաշտպանված նախագիծ",
    heroEyebrow: "Հայաստանի տան և վերանորոգման առաջատար անվտանգ գործարքների հարթակը",
    heroTitleBefore: "Պաշտպանեք ձեր ",
    heroTitleHighlight: "վերանորոգումը",
    heroTitleAfter: " Հայաստանում։",
    heroSubtitle:
      "Մի վճարեք վարպետին նախապես։ Մի սկսեք աշխատանքը առանց երաշխիքի։ VSTAH-ը կողպում է միջոցները մինչև աշխատանքի ավարտը։",
    cardChip1: "Էսկրոուով պաշտպանված կանխավճար",
    cardChip2: "Գրավոր աշխատանքային պայմանագիր",
    projectLabel: "Նախագիծ",
    projectId: "#AM-2841",
    projectTitle: "Բնակարանի վերանորոգում",
    projectStatus: "Ակտիվ",
    fundsLabel: "Ապահով հաշվում",
    lockedNote: "Կողպված է 3 փուլով",
    stage1Name: "Քանդում և նախապատրաստում",
    stage1Amount: "150,000 ֏",
    stage1State: "Արձակված",
    stage2Name: "Ջրմուղություն և էլեկտրիկա",
    stage2Amount: "200,000 ֏",
    stage2State: "Կողպված",
    stage3Name: "Վերջնահարդարում",
    stage3Amount: "100,000 ֏",
    stage3State: "Սպասում",
    cardMediation: "Միջոցները պաշտպանված են հայկական միջնորդությամբ",
    cardTagline1: "Կանգնեցրեք վեճերը։",
    cardTagline2: "Սկսեք վերանորոգումը։",
    feature1: "Ռիսկ չկա նախապես վճարելիս։",
    feature2: "Չվճարված աշխատանք չկա։",
    feature3: "Ստեղծված է Հայաստանում։",
    feature4: "Հայկական տների համար։",
    diffEyebrow: "Տարբերությունը",
    diffTitle: "VSTAH-ի հետ՝ ընդդեմ առանց մեզ",
    diffSubtitle:
      "Կանխեք վեճերը մինչև դրանք կսկսվեն։ Ահա թե ինչու տանտերերն ու վարպետները ընտրում են էսկրոուն։",
    recommended: "Առաջարկվող",
    colWith: "VSTAH-ով",
    colWithout: "Առանց մեզ",
    comparisonRows: [
      {
        label: "Գումարի պաշտպանություն",
        withVstah: "Կանխավճարը կողպված է էսկրոուում մինչև աշխատանքի հաստատումը",
        withoutUs: "Կանխիկը հանձնվում է և հուսում են լավագույնի վրա"
      },
      {
        label: "Գրավոր պայմանագիր",
        withVstah: "Թվային պայմանագիր՝ ստորագրված երկու կողմերից",
        withoutUs: "Բանավոր խոստումներ և WhatsApp հաղորդագրություններ"
      },
      {
        label: "Վերանորոգման փուլեր",
        withVstah: "Վճարում յուրաքանչյուր ավարտված փուլի համար, արձակում հաստատումից հետո",
        withoutUs: "Լրիվ վճարում նախապես կամ վեճ հետո"
      },
      {
        label: "Վեճեր",
        withVstah: "Ներառված է հայկական իրավական միջնորդություն",
        withoutUs: "Անձնական վեճեր, կորած ժամանակ և գումար"
      },
      {
        label: "Թափանցիկություն",
        withVstah: "Յուրաքանչյուր փուլ գրանցված և ժամանակակետով",
        withoutUs: "Խոսակցության խառնաշփոթ և թյուրիմացություններ"
      },
      {
        label: "Վստահություն",
        withVstah: "Երաշխավորված է հարթակով՝ ոչ թե խոսքերով",
        withoutUs: "Կախված է նրանից, թե ում գիտեք"
      }
    ],
    processEyebrow: "Գործընթացը",
    processTitle: "Ինչպես է աշխատում",
    processSubtitle:
      "Չորս պարզ քայլ։ Չկա անորոշություն։ Պաշտպանված են և տանտերը, և վարպետը։",
    processSteps: [
      {
        step: "01",
        title: "Ստեղծել նախագծի գործարքը",
        desc: "Նշեք վերանորոգման ծավալը, փուլերը և ընդհանուր արժեքը րոպեների ընթացքում։"
      },
      {
        step: "02",
        title: "Տանտերը կանխավճարում է",
        desc: "Գումարները կողպված են էսկրոուում։ Ապահով և թափանցիկ։"
      },
      {
        step: "03",
        title: "Վարպետը սկսում է աշխատանքը",
        desc: "Աշխատանքը սկսվում է լիակատար վստահությամբ, որ գումարը սպասում է։"
      },
      {
        step: "04",
        title: "Հաստատել և արձակել",
        desc: "Տանտերը հաստատում է յուրաքանչյուր փուլը՝ գումարը արձակվում է վարպետին։"
      }
    ],
    disputeEyebrow: "Վեճերի լուծում",
    disputeTitle: "Եթե ինչ-որ բան սխալ է ընթանում, մենք միջամտում ենք։",
    disputeBody:
      "Մեր հայկական իրավական փորձագետները միջնորդում են, երբ վերանորոգման նախագծերը բարդանում են։ Արդար, արագ և հիմնված տեղական օրենքի վրա՝ երկու կողմերն էլ հասնեն լուծման։",
    badge24h: "24ժ",
    badge24hSub: "Պատասխանի ժամանակ",
    badgeLaw: "100%",
    badgeLawSub: "Հայկական օրենք",
    badgeMed: "3-քայլ",
    badgeMedSub: "Միջնորդության գործընթաց",
    footerTagline: "Անվտանգ գործարքներ հայկական տների համար՝ պաշտպանված վճարումներ սկսից մինչև վերջ։",
    footerRights: "© 2026 VSTAH.am։ Բոլոր իրավունքները պաշտպանված են։",
    footerPhoneLabel: "Հեռախոս",
    footerTerms: "Պայմաններ",
    footerPrivacy: "Գաղտնիության քաղաքականություն",
    footerFollow: "Հետևեք մեզ",
    tableCategory: "Թեմա"
  },
  ru: {
    brand: "VSTAH.am",
    navHome: "Главная",
    navHowItWorks: "Как это работает",
    btnCreateDeal: "Создать сделку",
    btnProtectProject: "Защитить проект",
    btnSeeHow: "Как это работает",
    btnStartProtected: "Начать защищённый проект",
    heroEyebrow: "Ведущая в Армении платформа безопасных сделок для дома и ремонта",
    heroTitleBefore: "Защитите свой ",
    heroTitleHighlight: "ремонт",
    heroTitleAfter: " в Армении.",
    heroSubtitle:
      "Не платите подрядчику вперёд. Не начинайте работы без гарантий. VSTAH блокирует средства до завершения работ.",
    cardChip1: "Депозит под эскроу",
    cardChip2: "Письменный договор на работы",
    projectLabel: "Проект",
    projectId: "#AM-2841",
    projectTitle: "Ремонт квартиры",
    projectStatus: "Активен",
    fundsLabel: "Средства в защите",
    lockedNote: "Заблокировано на 3 этапа",
    stage1Name: "Демонтаж и подготовка",
    stage1Amount: "150 000 ֏",
    stage1State: "Выплачено",
    stage2Name: "Сантехника и электрика",
    stage2Amount: "200 000 ֏",
    stage2State: "Заблокировано",
    stage3Name: "Финишная отделка",
    stage3Amount: "100 000 ֏",
    stage3State: "Ожидание",
    cardMediation: "Средства защищены армянским посредничеством",
    cardTagline1: "Остановите споры.",
    cardTagline2: "Начните ремонт.",
    feature1: "Без риска предоплаты.",
    feature2: "Без неоплаченных работ.",
    feature3: "Создано в Армении.",
    feature4: "Для армянских домов.",
    diffEyebrow: "Разница",
    diffTitle: "С VSTAH и без нас",
    diffSubtitle:
      "Остановите споры до того, как они начнутся. Почему заказчики и подрядчики выбирают эскроу.",
    recommended: "Рекомендуется",
    colWith: "С VSTAH",
    colWithout: "Без нас",
    comparisonRows: [
      {
        label: "Защита средств",
        withVstah: "Депозит в эскроу до приёмки работ",
        withoutUs: "Наличные в руки — и надежда на лучшее"
      },
      {
        label: "Письменный договор",
        withVstah: "Цифровой контракт с подписями обеих сторон",
        withoutUs: "Устные обещания и переписки в WhatsApp"
      },
      {
        label: "Этапы ремонта",
        withVstah: "Оплата по завершённым этапам, выплата после одобрения",
        withoutUs: "Полная предоплата или спор потом"
      },
      {
        label: "Споры",
        withVstah: "Включено правовое посредничество по Армении",
        withoutUs: "Личные конфликты, потерянное время и деньги"
      },
      {
        label: "Прозрачность",
        withVstah: "Каждый этап залогирован и с меткой времени",
        withoutUs: "Недопонимание и ошибки в коммуникации"
      },
      {
        label: "Доверие",
        withVstah: "Гарантия платформы — не просто обещания",
        withoutUs: "Зависит от того, кого вы знаете"
      }
    ],
    processEyebrow: "Процесс",
    processTitle: "Как это работает",
    processSubtitle:
      "Четыре простых шага. Без догадок. Защищены и заказчик, и подрядчик.",
    processSteps: [
      {
        step: "01",
        title: "Создать сделку по проекту",
        desc: "Задайте объём ремонта, этапы и общую стоимость за считанные минуты."
      },
      {
        step: "02",
        title: "Депозит заказчика",
        desc: "Средства блокируются в эскроу. Безопасно и прозрачно."
      },
      {
        step: "03",
        title: "Подрядчик начинает работы",
        desc: "Работы стартуют с уверенностью, что деньги уже зарезервированы."
      },
      {
        step: "04",
        title: "Одобрить и выплатить",
        desc: "Заказчик одобряет каждый этап — средства выплачиваются подрядчику."
      }
    ],
    disputeEyebrow: "Разрешение споров",
    disputeTitle: "Если что-то идёт не так, мы подключаемся.",
    disputeBody:
      "Наши армянские юристы-медиаторы помогают, когда ремонтные проекты усложняются. Честно, быстро и по местному закону — чтобы обе стороны пришли к решению.",
    badge24h: "24ч",
    badge24hSub: "Время ответа",
    badgeLaw: "100%",
    badgeLawSub: "Закон Армении",
    badgeMed: "3 шага",
    badgeMedSub: "Процесс медиации",
    footerTagline: "Безопасные сделки для армянских домов — защищённые платежи от начала до сдачи.",
    footerRights: "© 2026 VSTAH.am. Все права защищены.",
    footerPhoneLabel: "Телефон",
    footerTerms: "Условия использования",
    footerPrivacy: "Политика конфиденциальности",
    footerFollow: "Мы в соцсетях",
    tableCategory: "Тема"
  }
};

const processIcons = [FileText, Landmark, Hammer, CircleCheck] as const;

export default function Page() {
  const { language: locale, setLanguage: setLocale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const langButtons = useMemo(
    () => [
      { code: "en" as const, short: "EN", label: "English" },
      { code: "hy" as const, short: "HY", label: "Հայերեն" },
      { code: "ru" as const, short: "RU", label: "Русский" }
    ],
    []
  );

  const t = translations[locale];
  const loginLabel = locale === "hy" ? "Մուտք" : locale === "ru" ? "Войти" : "Log in";
  const currentLangShort = langButtons.find((item) => item.code === locale)?.short ?? "EN";

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white shadow-lg shadow-black/10">
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-3 px-4 md:h-[84px] md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
            <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-10 w-10 md:h-11 md:w-11" />
            <span className="text-lg font-bold tracking-tight md:text-xl">{t.brand}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-700 md:flex">
            <Link href="/" className="transition hover:text-slate-900">
              {t.navHome}
            </Link>
            <a href="#difference" className="transition hover:text-slate-900">
              {t.navHowItWorks}
            </a>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-label="Change language"
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 pr-4 text-slate-900 transition hover:border-slate-400"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300">
                  <Globe className="h-5 w-5" />
                </span>
                <span className="text-sm font-bold">{currentLangShort}</span>
                <ChevronDown className={`h-5 w-5 transition ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {langButtons.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLocale(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                        locale === item.code ? "bg-slate-100 text-[#0033A0]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {locale === item.code ? <Check className="h-4 w-4" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <Link
              href="/login?next=%2Fdashboard"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {loginLabel}
            </Link>
            <OrangeButton href="/register?next=%2Fdashboard" className="px-5 py-2.5 text-sm sm:px-6 sm:py-3">
              {t.btnCreateDeal}
            </OrangeButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangMenuOpen((o) => !o)}
                aria-label="Change language"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 text-slate-900"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold">{currentLangShort}</span>
                <ChevronDown className={`h-4 w-4 transition ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen ? (
                <div className="absolute left-0 top-10 z-50 min-w-[150px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {langButtons.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLocale(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
                        locale === item.code ? "bg-slate-100 text-[#0033A0]" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{item.label}</span>
                      {locale === item.code ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              aria-expanded={mobileOpen}
              aria-label="Menu"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3 md:hidden">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
              <nav className="flex flex-col gap-1.5">
                <Link
                  href="/"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.navHome}
                </Link>
                <a
                  href="#difference"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.navHowItWorks}
                </a>
              </nav>
              <div className="my-3 h-px bg-slate-200" />
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700"
                >
                  {loginLabel}
                </Link>
                <Link
                  href="/register?next=%2Fdashboard"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F2A800] text-sm font-bold text-slate-900"
                >
                  {t.btnCreateDeal}
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1" style={{ backgroundColor: NAVY }}>
        <section className="relative overflow-hidden border-b border-white/10 pb-16 pt-10 md:pb-24 md:pt-14">
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/[0.06] blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:items-center md:gap-16 lg:gap-20 md:px-6">
            <div className="flex flex-col justify-center">
              <p className="inline-flex w-fit max-w-full rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium leading-snug text-white/90 shadow-sm backdrop-blur-sm md:text-sm">
                {t.heroEyebrow}
              </p>
              <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                {t.heroTitleBefore}
                <span className="relative inline" style={{ color: ORANGE }}>
                  <span className="relative z-10">{t.heroTitleHighlight}</span>
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-transparent via-orange-300/90 to-transparent"
                    aria-hidden
                  />
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-white/25" aria-hidden />
                </span>
                {t.heroTitleAfter}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">{t.heroSubtitle}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/register?next=%2Fdashboard"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#DC2626] px-8 text-sm font-semibold text-white shadow-sm shadow-red-900/30 transition hover:bg-[#B91C1C] sm:h-12 sm:text-base"
                >
                  {t.btnProtectProject}
                </Link>
                <OutlineLightButton href="/#difference" className="h-12 border-white/40 px-8 sm:h-12">
                  {t.btnSeeHow}
                </OutlineLightButton>
              </div>
              <ul className="mt-10 flex flex-col gap-3 text-sm text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-10">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-orange-200 shadow-sm ring-1 ring-white/20">
                    <Shield className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="font-medium">{t.cardChip1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-orange-200 shadow-sm ring-1 ring-white/20">
                    <FileText className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="font-medium">{t.cardChip2}</span>
                </li>
              </ul>
            </div>

            <div className="relative pb-14 lg:pb-12">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-slate-200/80 to-slate-100/50 blur-sm" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 sm:px-5">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                    <span className="h-2 w-2 rounded-full bg-slate-200" />
                  </div>
                  <span className="flex-1 truncate text-center text-[11px] font-medium text-slate-400">vstah.app</span>
                </div>
                <div className="p-5 text-slate-900 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                        {t.projectLabel}{" "}
                        <span className="text-slate-900">{t.projectId}</span>
                      </p>
                      <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{t.projectTitle}</h2>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {t.projectStatus}
                    </span>
                  </div>
                  <div className="mt-5 overflow-hidden rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#1E40AF] p-5 text-white shadow-inner sm:p-6">
                    <p className="text-xs font-medium uppercase tracking-wider text-white/75">{t.fundsLabel}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                      450,000 <span className="text-xl font-semibold text-white/80 sm:text-2xl">֏</span>
                    </p>
                    <p className="mt-2 text-sm font-medium text-white/90">{t.lockedNote}</p>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t.stage1Name}</p>
                        <p className="text-xs font-medium text-slate-500">{t.stage1Amount}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        {t.stage1State}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t.stage2Name}</p>
                        <p className="text-xs font-medium text-slate-500">{t.stage2Amount}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1D4ED8]">
                        <Lock className="h-3 w-3" strokeWidth={2.5} />
                        {t.stage2State}
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{t.stage3Name}</p>
                        <p className="text-xs font-medium text-slate-500">{t.stage3Amount}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        <Clock className="h-3 w-3" strokeWidth={2.5} />
                        {t.stage3State}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 z-10 w-[min(100%,22rem)] -translate-x-1/2 px-2 sm:w-full sm:max-w-sm">
                <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-700 shadow-lg shadow-slate-900/10">
                  {t.cardMediation}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white py-12 text-slate-900 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 md:px-6">
            {[
              { text: t.feature1, icon: Shield },
              { text: t.feature2, icon: Wallet },
              { text: t.feature3, icon: Building2 },
              { text: t.feature4, icon: House }
            ].map(({ text, icon: Icon }) => (
              <div key={text} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md" style={{ backgroundColor: RED }}>
                  <Icon className="h-6 w-6" />
                </span>
                <p className="pt-1 text-sm font-bold leading-snug whitespace-nowrap md:text-base">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="difference" className="scroll-mt-28 bg-slate-100 py-16 text-slate-900 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-slate-500">{t.diffEyebrow}</p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
              {t.diffTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-600 md:text-lg">{t.diffSubtitle}</p>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 px-5 py-4 text-white" style={{ backgroundColor: "#0f43ac" }}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/75">{t.recommended}</p>
                    <p className="text-3xl font-black leading-none md:text-[2.1rem]">{t.colWith}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`with-${row.label}`} className="flex items-start gap-3 px-5 py-4">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900">{row.label}</p>
                        <p className="text-[15px] leading-relaxed text-slate-600">{row.withVstah}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-5 py-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Old way</p>
                    <p className="text-3xl font-black leading-none text-slate-900 md:text-[2.1rem]">{t.colWithout}</p>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {t.comparisonRows.map((row) => (
                    <li key={`without-${row.label}`} className="flex items-start gap-3 px-5 py-4">
                      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50">
                        <X className="h-4 w-4 text-red-500" strokeWidth={3} />
                      </span>
                      <div>
                        <p className="font-extrabold text-slate-900">{row.label}</p>
                        <p className="text-[15px] leading-relaxed text-slate-600">{row.withoutUs}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="process" className="scroll-mt-28 border-t border-white/10 bg-white py-16 text-slate-900 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-center text-xs font-black uppercase tracking-[0.25em]" style={{ color: NAVY }}>
              {t.processEyebrow}
            </p>
            <h2 className="mt-3 text-center text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
              {t.processTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-slate-600 md:text-lg">{t.processSubtitle}</p>

            <div className="relative mt-14">
              <div className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-1 rounded-full opacity-40 lg:block" style={{ background: `linear-gradient(90deg, transparent, ${NAVY}, transparent)` }} aria-hidden />
              <ol className="relative grid gap-8 lg:grid-cols-4">
                {t.processSteps.map((step, idx) => {
                  const Icon = processIcons[idx]!;
                  return (
                    <li key={step.step} className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
                      <span className="absolute right-4 top-4 font-mono text-5xl font-black text-slate-100">{step.step}</span>
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: NAVY }}>
                        <Icon className="h-7 w-7" strokeWidth={2} />
                      </div>
                      <h3 className="relative mt-5 text-lg font-black" style={{ color: NAVY }}>
                        {step.title}
                      </h3>
                      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                      <div className="relative mt-4 flex items-center gap-1 text-xs font-bold uppercase" style={{ color: RED }}>
                        <ArrowRight className="h-4 w-4" />
                        VSTAH
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-16 md:py-24" style={{ backgroundColor: NAVY }}>
          <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, ${RED}, transparent 40%)` }} aria-hidden />
          <div className="relative mx-auto max-w-3xl px-4 text-center md:px-6">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/70">{t.disputeEyebrow}</p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">{t.disputeTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-white/85 md:text-lg">{t.disputeBody}</p>
            <div className="mt-8 flex justify-center">
              <OrangeButton href="/register?next=%2Fdashboard">{t.btnStartProtected}</OrangeButton>
            </div>
            <div className="mt-12 flex flex-wrap items-stretch justify-center gap-4">
              {[
                { main: t.badge24h, sub: t.badge24hSub, icon: Clock },
                { main: t.badgeLaw, sub: t.badgeLawSub, icon: Scale },
                { main: t.badgeMed, sub: t.badgeMedSub, icon: ListOrdered }
              ].map(({ main, sub, icon: Icon }) => (
                <div key={sub} className="flex min-w-[140px] flex-1 flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white backdrop-blur-sm sm:flex-none">
                  <Icon className="h-6 w-6" style={{ color: ORANGE }} />
                  <p className="mt-2 text-2xl font-black">{main}</p>
                  <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-white/75">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 py-10 text-slate-700 md:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1.6fr_1fr_1fr] md:gap-10 md:px-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-9 w-9 shrink-0" />
              <span className="text-lg font-bold tracking-tight md:text-xl" style={{ color: NAVY }}>
                VSTAH.am
              </span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-600">{t.footerTagline}</p>
            <a href="tel:+37411550550" className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
              <Phone className="h-4 w-4" />
              <span>
                {t.footerPhoneLabel}: +374 11 550 550
              </span>
            </a>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              <Link href="/" className="font-medium text-slate-900 underline-offset-4 transition hover:underline">
                Home
              </Link>
            </p>
            <p>
              <Link href="/terms" className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline">
                {t.footerTerms}
              </Link>
            </p>
            <p>
              <Link href="/privacy" className="text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline">
                {t.footerPrivacy}
              </Link>
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <p className="font-medium text-slate-900">{t.footerFollow}</p>
            <div className="flex items-center gap-2.5">
              <a
                href="https://instagram.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#E4405F] transition hover:opacity-90"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://facebook.com/vstah.am"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#1877F2] transition hover:opacity-90"
              >
                <Facebook className="h-4.5 w-4.5" />
              </a>
            </div>
            <p className="text-xs text-slate-500">{t.footerRights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

```


---

### `app/(account)/layout.tsx`

```tsx
"use client";

import { Providers } from "../providers";

/**
 * Auth + Supabase only load for account routes, not the marketing homepage.
 * This prevents a bad .env or Supabase error from taking down `/`.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

```


---

### `app/(account)/login/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, resendConfirmation, requestPasswordReset, user } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const nextRoute = searchParams.get("next") || "/dashboard";
  const emailPrefill = searchParams.get("email") || "";
  const tx =
    language === "hy"
      ? {
          eyebrow: "Հաշիվ",
          title: "Մուտք",
          subtitle: "Ապահով մուտք տանտերերի և ծառայություն մատուցողների համար։",
          email: "Էլ. հասցե",
          password: "Գաղտնաբառ",
          forgot: "Մոռացե՞լ եք գաղտնաբառը",
          closeReset: "Փակել վերականգնումը",
          resetTitle: "Վերականգնել գաղտնաբառը",
          resetSubtitle: "Մուտքագրեք էլ. հասցեն, և մենք կուղարկենք վերականգնման հղումը։",
          resetEmail: "Վերականգնման էլ. հասցե",
          sendReset: "Ուղարկել վերականգնման հղում",
          sendingReset: "Ուղարկվում է...",
          resend: "Վերաուղարկել հաստատման նամակը",
          sendingConfirmation: "Հաստատումը ուղարկվում է...",
          signIn: "Մուտք",
          signingIn: "Մուտք է կատարվում...",
          noAccount: "Հաշիվ չունե՞ք",
          register: "Գրանցվել",
          resetEmailRequired: "Խնդրում ենք մուտքագրել էլ. հասցեն վերականգնման դաշտում։",
          confirmationSent: "Հաստատման նամակը ուղարկվեց։ Ստուգեք մուտքային և spam թղթապանակները։",
          resetSent: "Գաղտնաբառի վերականգնման նամակը ուղարկվեց։ Ստուգեք մուտքային և spam թղթապանակները։",
          resendNeedsEmail: "Նախ մուտքագրեք էլ. հասցեն, հետո վերաուղարկեք հաստատումը։"
        }
      : language === "ru"
        ? {
            eyebrow: "Аккаунт",
            title: "Вход",
            subtitle: "Безопасный вход для клиентов и исполнителей.",
            email: "Email",
            password: "Пароль",
            forgot: "Забыли пароль?",
            closeReset: "Закрыть восстановление",
            resetTitle: "Сброс пароля",
            resetSubtitle: "Введите email, и мы отправим ссылку для сброса пароля.",
            resetEmail: "Email для сброса",
            sendReset: "Отправить ссылку",
            sendingReset: "Отправка...",
            resend: "Повторно отправить подтверждение",
            sendingConfirmation: "Отправка подтверждения...",
            signIn: "Войти",
            signingIn: "Вход...",
            noAccount: "Нет аккаунта?",
            register: "Регистрация",
            resetEmailRequired: "Введите email в поле для сброса.",
            confirmationSent: "Письмо подтверждения отправлено. Проверьте входящие и спам.",
            resetSent: "Письмо для сброса пароля отправлено. Проверьте входящие и спам.",
            resendNeedsEmail: "Сначала введите email, затем отправьте подтверждение."
          }
        : {
            eyebrow: "Account",
            title: "Login",
            subtitle: "Secure access for homeowners and contractors.",
            email: "Email",
            password: "Password",
            forgot: "Forgot password?",
            closeReset: "Close reset",
            resetTitle: "Reset your password",
            resetSubtitle: "Enter your email and we will send you a reset link.",
            resetEmail: "Reset Email",
            sendReset: "Send reset link",
            sendingReset: "Sending reset link...",
            resend: "Resend confirmation email",
            sendingConfirmation: "Sending confirmation...",
            signIn: "Sign in",
            signingIn: "Signing in...",
            noAccount: "No account?",
            register: "Register",
            resetEmailRequired: "Please enter your email in the reset field.",
            confirmationSent: "Confirmation email sent. Please check your inbox and spam folder.",
            resetSent: "Password reset email sent. Please check your inbox and spam folder.",
            resendNeedsEmail: "Enter your email first, then resend confirmation."
          };

  useEffect(() => {
    if (user) router.replace(nextRoute);
  }, [user, router, nextRoute]);

  useEffect(() => {
    if (!emailPrefill) return;
    setEmail(emailPrefill);
    setResetEmail(emailPrefill);
  }, [emailPrefill]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const res = await signIn(email, password);
    setPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.replace(nextRoute);
    router.refresh();
  }

  async function handleResendConfirmation() {
    if (!email.trim()) {
      setError(tx.resendNeedsEmail);
      return;
    }
    setError(null);
    setInfo(null);
    setResendPending(true);
    const res = await resendConfirmation(email.trim());
    setResendPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setInfo(tx.confirmationSent);
  }

  async function handleForgotPasswordSend() {
    if (!resetEmail.trim()) {
      setError(tx.resetEmailRequired);
      return;
    }
    setError(null);
    setInfo(null);
    setResetPending(true);
    const res = await requestPasswordReset(resetEmail.trim());
    setResetPending(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setInfo(tx.resetSent);
  }

  const showResend = Boolean(error && error.toLowerCase().includes("confirm"));

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
            {tx.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              {tx.password}
            </label>
            <button
              type="button"
              onClick={() => {
                setShowResetForm((prev) => !prev);
                if (!resetEmail.trim() && email.trim()) setResetEmail(email.trim());
                setError(null);
                setInfo(null);
              }}
              className="text-xs font-semibold text-[#0033A0] underline underline-offset-2 transition hover:text-[#002b86]"
            >
              {showResetForm ? tx.closeReset : tx.forgot}
            </button>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}
        {showResend ? (
          <button
            type="button"
            onClick={() => void handleResendConfirmation()}
            disabled={resendPending}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
          >
            {resendPending ? tx.sendingConfirmation : tx.resend}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? tx.signingIn : tx.signIn}
        </button>
      </form>
      {showResetForm ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{tx.resetTitle}</p>
          <p className="mt-1 text-xs text-slate-600">{tx.resetSubtitle}</p>
          <label htmlFor="resetEmail" className="mt-3 block text-sm font-medium text-slate-700">
            {tx.resetEmail}
          </label>
          <input
            id="resetEmail"
            type="email"
            autoComplete="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
          <button
            type="button"
            onClick={() => void handleForgotPasswordSend()}
            disabled={resetPending}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-70"
          >
            {resetPending ? tx.sendingReset : tx.sendReset}
          </button>
        </div>
      ) : null}

      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.noAccount}{" "}
        <Link href={`/register?next=${encodeURIComponent(nextRoute)}`} className="font-semibold underline" style={{ color: NAVY }}>
          {tx.register}
        </Link>
      </p>
    </VstahShell>
  );
}

```


---

### `app/(account)/register/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

const DEFAULT_SERVICE_CATEGORY = "General Contractor" as const;
const serviceCategoryLabel = {
  en: "General Contractor",
  hy: "Գլխավոր կապալառու",
  ru: "Генеральный подрядчик"
} as const;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, user } = useAuth();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullNameOrBusinessName, setFullNameOrBusinessName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitLock = useRef(false);
  const nextRoute = searchParams.get("next") || "/dashboard";
  const tx =
    language === "hy"
      ? {
          eyebrow: "Հաշիվ",
          title: "Գրանցում",
          subtitle: "Ստեղծեք հաշիվ՝ պաշտպանված գործարքները կառավարելու համար։",
          passwordsNoMatch: "Գաղտնաբառերը չեն համընկնում։",
          passwordTooShort: "Գաղտնաբառը պետք է լինի առնվազն 6 նիշ։",
          completeDetails: "Խնդրում ենք լրացնել ծառայություն մատուցողի բոլոր պարտադիր տվյալները։",
          confirmEmail: "Ստուգեք ձեր էլ․ փոստը, հաստատեք էլ․ հասցեն և վերադարձեք մուտք գործելու համար։",
          fullNameOrBusinessName: "Ամբողջ անուն / Բիզնեսի անվանում",
          phoneNumber: "Հեռախոսահամար",
          serviceCategory: "Ծառայության կատեգորիա",
          selectService: "Ընտրել ծառայությունը",
          serviceArea: "Սպասարկման տարածք",
          email: "Էլ. հասցե",
          password: "Գաղտնաբառ",
          confirmPassword: "Հաստատել գաղտնաբառը",
          creating: "Հաշիվը ստեղծվում է...",
          create: "Ստեղծել հաշիվ",
          alreadyRegistered: "Արդեն գրանցվա՞ծ եք",
          login: "Մուտք"
        }
      : language === "ru"
        ? {
            eyebrow: "Аккаунт",
            title: "Регистрация",
            subtitle: "Создайте аккаунт для управления защищенными сделками.",
            passwordsNoMatch: "Пароли не совпадают.",
            passwordTooShort: "Пароль должен содержать минимум 6 символов.",
            completeDetails: "Пожалуйста, заполните все обязательные данные исполнителя.",
            confirmEmail: "Проверьте почту, подтвердите email и вернитесь для входа.",
            fullNameOrBusinessName: "Полное имя / Название бизнеса",
            phoneNumber: "Номер телефона",
            serviceCategory: "Категория услуги",
            selectService: "Выберите услугу",
            serviceArea: "Регион обслуживания",
            email: "Email",
            password: "Пароль",
            confirmPassword: "Подтвердите пароль",
            creating: "Создание аккаунта...",
            create: "Создать аккаунт",
            alreadyRegistered: "Уже зарегистрированы?",
            login: "Войти"
          }
        : {
            eyebrow: "Account",
            title: "Register",
            subtitle: "Create an account to manage protected deals.",
            passwordsNoMatch: "Passwords do not match.",
            passwordTooShort: "Password must be at least 6 characters.",
            completeDetails: "Please fill in all required service provider details.",
            confirmEmail: "Check your inbox and confirm your email, then return here to log in.",
            fullNameOrBusinessName: "Full Name / Business Name",
            phoneNumber: "Phone Number",
            serviceCategory: "Service Category",
            selectService: "Select service",
            serviceArea: "Service Area",
            email: "Email",
            password: "Password",
            confirmPassword: "Confirm password",
            creating: "Creating account...",
            create: "Create account",
            alreadyRegistered: "Already registered?",
            login: "Login"
          };

  useEffect(() => {
    if (user) router.replace(nextRoute);
  }, [user, router, nextRoute]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending || submitLock.current) return;
    setError(null);
    setInfo(null);
    if (password !== confirm) {
      setError(tx.passwordsNoMatch);
      return;
    }
    if (password.length < 6) {
      setError(tx.passwordTooShort);
      return;
    }
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError(tx.completeDetails);
      return;
    }
    if (!fullNameOrBusinessName.trim() || !phoneNumber.trim() || !serviceArea.trim()) {
      setError(tx.completeDetails);
      return;
    }
    submitLock.current = true;
    setPending(true);
    try {
      const res = await signUp(email, password, {
        full_name_or_business_name: fullNameOrBusinessName.trim(),
        phone_number: phoneNumber.trim(),
        service_category: DEFAULT_SERVICE_CATEGORY,
        service_area: serviceArea.trim()
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.needsEmailConfirmation) {
        setInfo(tx.confirmEmail);
        return;
      }
      router.replace(nextRoute);
      router.refresh();
    } finally {
      setPending(false);
      submitLock.current = false;
    }
  }

  return (
    <VstahShell eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.subtitle}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="fullNameOrBusinessName" className="block text-sm font-semibold text-slate-700">
              {tx.fullNameOrBusinessName}
            </label>
            <input
              id="fullNameOrBusinessName"
              type="text"
              autoComplete="organization"
              required
              value={fullNameOrBusinessName}
              onChange={(e) => setFullNameOrBusinessName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-slate-700">
              {tx.phoneNumber}
            </label>
            <input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div>
            <label htmlFor="serviceCategory" className="block text-sm font-semibold text-slate-700">
              {tx.serviceCategory}
            </label>
            <input
              id="serviceCategory"
              type="text"
              readOnly
              value={serviceCategoryLabel[language]}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="serviceArea" className="block text-sm font-semibold text-slate-700">
              {tx.serviceArea}
            </label>
            <input
              id="serviceArea"
              type="text"
              required
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
            {tx.email}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
            {tx.password}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">
            {tx.confirmPassword}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? tx.creating : tx.create}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {tx.alreadyRegistered}{" "}
        <Link href={`/login?next=${encodeURIComponent(nextRoute)}`} className="font-semibold underline" style={{ color: NAVY }}>
          {tx.login}
        </Link>
      </p>
    </VstahShell>
  );
}

```


---

### `app/(account)/create-deal/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { enqueueDbPayload } from "@/lib/demo-queue";
import { prepareCreateDealPayload } from "@/lib/db/prepare-payload";
import type { CreateDealPayload } from "@/lib/db/types";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";

export default function CreateDealPage() {
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
      alert("Enter a valid total amount in AMD.");
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
      eyebrow="Escrow"
      title="Create a deal"
      subtitle="Define your renovation project and deposit terms. Data is structured for your database."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Project title</label>
          <input
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="e.g. Apartment renovation — Yerevan"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="Scope of work, materials, timeline…"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Total amount (AMD)</label>
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
          <label className="block text-sm font-semibold text-slate-700">Renovation stages</label>
          <textarea
            required
            rows={3}
            value={renovationStages}
            onChange={(e) => setRenovationStages(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="Stage 1: … Stage 2: …"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Your name</label>
            <input
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Your email</label>
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
          <label className="block text-sm font-semibold text-slate-700">Contractor email (optional)</label>
          <input
            type="email"
            value={contractorEmail}
            onChange={(e) => setContractorEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Notes</label>
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
          {pending ? "Saving…" : "Save deal (prepare for database)"}
        </button>
      </form>

      {lastPayload ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-semibold text-slate-700">Prepared JSON (ready for API / Supabase)</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="font-semibold underline" style={{ color: NAVY }}>
          Back to home
        </Link>
      </p>
    </VstahShell>
  );
}

```


---

### `app/(account)/protect/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { VstahShell } from "@/components/vstah-shell";
import { enqueueDbPayload } from "@/lib/demo-queue";
import { prepareProtectProjectPayload } from "@/lib/db/prepare-payload";
import type { ProtectProjectPayload } from "@/lib/db/types";
import { NAVY, ORANGE } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";

export default function ProtectProjectPage() {
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
    <VstahShell
      eyebrow="Protection"
      title="Protect my project"
      subtitle="Invite your contractor to a clear, escrow-backed agreement."
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Your email</label>
            <input
              required
              type="email"
              value={homeownerEmail}
              onChange={(e) => setHomeownerEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">Your name (optional)</label>
            <input
              value={homeownerName}
              onChange={(e) => setHomeownerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Contractor email to invite</label>
          <input
            required
            type="email"
            value={contractorInviteEmail}
            onChange={(e) => setContractorInviteEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="contractor@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Project summary</label>
          <textarea
            required
            rows={4}
            value={projectSummary}
            onChange={(e) => setProjectSummary(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="Address, scope, timeline, agreed total…"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Invitation message (optional)</label>
          <textarea
            rows={3}
            value={invitationMessage}
            onChange={(e) => setInvitationMessage(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-[#0033A0]/40 focus:ring-4 focus:ring-[#0033A0]/15"
            placeholder="Short note to your contractor…"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 disabled:opacity-70 sm:text-base"
          style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
        >
          {pending ? "Saving…" : "Prepare invitation (database-ready)"}
        </button>
      </form>

      {lastPayload ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-sm font-semibold text-slate-700">Prepared JSON (ready for API / Supabase)</p>
          <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      ) : null}

      <p className="mt-8 text-center text-sm text-slate-600">
        <Link href="/" className="font-semibold underline" style={{ color: NAVY }}>
          Back to home
        </Link>
      </p>
    </VstahShell>
  );
}

```


---

### `app/dashboard/layout.tsx`

```tsx
"use client";

import { Providers } from "../providers";

/**
 * Dashboard requires auth context, but we keep marketing routes free from auth bootstrapping.
 * Wrapping only this route prevents `useAuth` context errors.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

```


---

### `app/dashboard/page.tsx`

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Check, Copy, Download, ExternalLink, FilePlus2, LayoutDashboard, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { insertAgreementWithSchemaFallback, normalizeAgreementRow } from "@/lib/agreements/row";
import { useLanguage, type Language } from "@/lib/i18n/language-context";

type Lang = Language;
type View = "overview" | "create" | "archive";
type AgreementStatus = "pending" | "signed" | "completed";
type DerivedAgreementStatus = AgreementStatus | "in_progress" | "paid" | "funds_secured";
type PaymentType = "single" | "milestones";
type Milestone = { title: string; amount: number; status?: "pending" | "escrow_held" | "released" };
type MilestoneDraft = { id: string; title: string; amount: string };

type Agreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  total_price: number;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  created_at: string;
};

type Tx = {
  dashboardTitle: string;
  dashboardSubtitle: string;
  overview: string;
  createNewAgreement: string;
  archive: string;
  signedInAs: string;
  logout: string;
  language: string;
  agreementsTitle: string;
  archivedTitle: string;
  totalAgreementValue: string;
  signedAgreements: string;
  loading: string;
  emptyTitle: string;
  emptySubtitle: string;
  clientName: string;
  projectTitle: string;
  price: string;
  status: string;
  copyLink: string;
  viewLink: string;
  download: string;
  searchClientPlaceholder: string;
  noSearchResults: string;
  copied: string;
  createSafeAgreement: string;
  totalPrice: string;
  milestones: string;
  milestonesHint: string;
  singlePayment: string;
  addMilestone: string;
  milestoneTitle: string;
  milestoneAmount: string;
  milestonesMismatch: string;
  create: string;
  creating: string;
  completeRequired: string;
  completeMilestones: string;
  completedAgreements: string;
  noCompleted: string;
  successTitle: string;
  successSubtitle: string;
  publicLink: string;
  copyToClipboard: string;
  close: string;
  toastCreated: string;
  pending: string;
  signed: string;
  completed: string;
  inProgress: string;
  paid: string;
  fundsSecured: string;
  signatureSigned: string;
  paymentReleasedBanner: string;
  releaseProgress: string;
  vault: string;
  waiting: string;
  releasedOfTotal: string;
};

const t: Record<Lang, Tx> = {
  en: {
    dashboardTitle: "Service Provider Dashboard",
    dashboardSubtitle: "Manage your agreements professionally.",
    overview: "Overview",
    createNewAgreement: "Create New Agreement",
    archive: "Archive",
    signedInAs: "Signed in as",
    logout: "Log out",
    language: "Language",
    agreementsTitle: "Agreements",
    archivedTitle: "Archived Agreements",
    totalAgreementValue: "Total Agreement Value",
    signedAgreements: "Signed Agreements",
    loading: "Loading agreements...",
    emptyTitle: "Create your first deal to get started",
    emptySubtitle: "You can create a safe agreement and instantly share it with your client.",
    clientName: "Client Name",
    projectTitle: "Project Title",
    price: "Price",
    status: "Status",
    copyLink: "Copy Link",
    viewLink: "View Link",
    download: "Download",
    searchClientPlaceholder: "Search by client name...",
    noSearchResults: "No agreements match your search.",
    copied: "Copied!",
    createSafeAgreement: "Create Safe Agreement",
    totalPrice: "Total Price (AMD ֏)",
    milestones: "Milestones",
    milestonesHint: "Split payment into milestone amounts.",
    singlePayment: "Single payment selected.",
    addMilestone: "Add milestone",
    milestoneTitle: "Milestone title",
    milestoneAmount: "Amount (֏)",
    milestonesMismatch: "Milestones total must match total price.",
    create: "Create",
    creating: "Creating...",
    completeRequired: "Please complete all required fields.",
    completeMilestones: "Please fill all milestone titles and amounts.",
    completedAgreements: "Completed Agreements",
    noCompleted: "No completed agreements yet.",
    successTitle: "Agreement Created Successfully!",
    successSubtitle: "Share this public agreement link with your client.",
    publicLink: "Public Link",
    copyToClipboard: "Copy to Clipboard",
    close: "Close",
    toastCreated: "Agreement created successfully.",
    pending: "Pending",
    signed: "Signed",
    completed: "Completed",
    inProgress: "In Progress",
    paid: "Paid",
    fundsSecured: "Funds Secured",
    signatureSigned: "✍️ Signed",
    paymentReleasedBanner: "🎉 Payment released by client.",
    releaseProgress: "Release Progress",
    vault: "Vault",
    waiting: "Waiting",
    releasedOfTotal: "Released"
  },
  hy: {
    dashboardTitle: "Մատակարարի վահանակ",
    dashboardSubtitle: "Կառավարեք ձեր պայմանագրերը պրոֆեսիոնալ ձևով։",
    overview: "Ընդհանուր",
    createNewAgreement: "Ստեղծել նոր պայմանագիր",
    archive: "Արխիվ",
    signedInAs: "Մուտք գործած է",
    logout: "Դուրս գալ",
    language: "Լեզու",
    agreementsTitle: "Պայմանագրեր",
    archivedTitle: "Արխիվացված պայմանագրեր",
    totalAgreementValue: "Պայմանագրերի ընդհանուր արժեք",
    signedAgreements: "Ստորագրված պայմանագրեր",
    loading: "Պայմանագրերը բեռնվում են...",
    emptyTitle: "Ստեղծեք ձեր առաջին գործարքը սկսելու համար",
    emptySubtitle: "Ստեղծեք անվտանգ պայմանագիր և անմիջապես կիսվեք հաճախորդի հետ։",
    clientName: "Հաճախորդի անուն",
    projectTitle: "Նախագծի վերնագիր",
    price: "Գին",
    status: "Կարգավիճակ",
    copyLink: "Պատճենել հղումը",
    viewLink: "Բացել հղումը",
    download: "Ներբեռնել",
    searchClientPlaceholder: "Փնտրել ըստ հաճախորդի անվան...",
    noSearchResults: "Ձեր որոնմամբ պայմանագիր չի գտնվել։",
    copied: "Պատճենված է!",
    createSafeAgreement: "Ստեղծել անվտանգ պայմանագիր",
    totalPrice: "Ընդհանուր գին (AMD ֏)",
    milestones: "Փուլեր",
    milestonesHint: "Բաժանեք վճարումը փուլային գումարների։",
    singlePayment: "Ընտրված է մեկանգամյա վճարում։",
    addMilestone: "Ավելացնել փուլ",
    milestoneTitle: "Փուլի անվանում",
    milestoneAmount: "Գումար (֏)",
    milestonesMismatch: "Փուլերի գումարը պետք է հավասար լինի ընդհանուր գնին։",
    create: "Ստեղծել",
    creating: "Ստեղծվում է...",
    completeRequired: "Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը։",
    completeMilestones: "Խնդրում ենք լրացնել բոլոր փուլերի անվանումներն ու գումարները։",
    completedAgreements: "Ավարտված պայմանագրեր",
    noCompleted: "Ավարտված պայմանագրեր դեռ չկան։",
    successTitle: "Պայմանագիրը հաջողությամբ ստեղծվեց։",
    successSubtitle: "Կիսվեք այս հանրային հղումով ձեր հաճախորդի հետ։",
    publicLink: "Հանրային հղում",
    copyToClipboard: "Պատճենել",
    close: "Փակել",
    toastCreated: "Պայմանագիրը հաջողությամբ ստեղծվեց։",
    pending: "Սպասման մեջ",
    signed: "Ստորագրված",
    completed: "Ավարտված",
    inProgress: "Ընթացքում",
    paid: "Վճարված",
    fundsSecured: "Միջոցները ապահովված են",
    signatureSigned: "✍️ Ստորագրված",
    paymentReleasedBanner: "🎉 Հաճախորդը արձակել է վճարումը։",
    releaseProgress: "Արձակման առաջընթաց",
    vault: "Էսկրոու",
    waiting: "Սպասում",
    releasedOfTotal: "Արձակված"
  },
  ru: {
    dashboardTitle: "Панель поставщика услуг",
    dashboardSubtitle: "Профессионально управляйте своими соглашениями.",
    overview: "Обзор",
    createNewAgreement: "Создать новое соглашение",
    archive: "Архив",
    signedInAs: "В системе",
    logout: "Выйти",
    language: "Язык",
    agreementsTitle: "Соглашения",
    archivedTitle: "Архив соглашений",
    totalAgreementValue: "Общая стоимость соглашений",
    signedAgreements: "Подписанные соглашения",
    loading: "Загрузка соглашений...",
    emptyTitle: "Создайте первую сделку, чтобы начать",
    emptySubtitle: "Создайте безопасное соглашение и сразу отправьте клиенту.",
    clientName: "Имя клиента",
    projectTitle: "Название проекта",
    price: "Цена",
    status: "Статус",
    copyLink: "Копировать ссылку",
    viewLink: "Открыть ссылку",
    download: "Скачать",
    searchClientPlaceholder: "Поиск по имени клиента...",
    noSearchResults: "По вашему запросу соглашения не найдены.",
    copied: "Скопировано!",
    createSafeAgreement: "Создать безопасное соглашение",
    totalPrice: "Общая цена (AMD ֏)",
    milestones: "Этапы",
    milestonesHint: "Разделите оплату на этапы.",
    singlePayment: "Выбран единый платеж.",
    addMilestone: "Добавить этап",
    milestoneTitle: "Название этапа",
    milestoneAmount: "Сумма (֏)",
    milestonesMismatch: "Сумма этапов должна совпадать с общей ценой.",
    create: "Создать",
    creating: "Создание...",
    completeRequired: "Пожалуйста, заполните все обязательные поля.",
    completeMilestones: "Пожалуйста, заполните названия и суммы всех этапов.",
    completedAgreements: "Завершенные соглашения",
    noCompleted: "Завершенных соглашений пока нет.",
    successTitle: "Соглашение успешно создано!",
    successSubtitle: "Поделитесь этой публичной ссылкой с клиентом.",
    publicLink: "Публичная ссылка",
    copyToClipboard: "Копировать",
    close: "Закрыть",
    toastCreated: "Соглашение успешно создано.",
    pending: "Ожидание",
    signed: "Подписано",
    completed: "Завершено",
    inProgress: "В процессе",
    paid: "Оплачено",
    fundsSecured: "Средства обеспечены",
    signatureSigned: "✍️ Подписано",
    paymentReleasedBanner: "🎉 Клиент выплатил платеж.",
    releaseProgress: "Прогресс выплат",
    vault: "Эскроу",
    waiting: "Ожидает",
    releasedOfTotal: "Выплачено"
  }
};

const statusBadge: Record<DerivedAgreementStatus, string> = {
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  signed: "border-emerald-200 bg-emerald-100 text-emerald-800",
  completed: "border-blue-200 bg-blue-100 text-[#0033A0]",
  in_progress: "border-orange-200 bg-orange-100 text-orange-800",
  paid: "border-emerald-200 bg-emerald-100 text-emerald-800",
  funds_secured: "border-blue-200 bg-blue-100 text-[#0033A0]"
};

const createMilestone = (): MilestoneDraft => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  amount: ""
});

const formatAMD = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} ֏`;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { language: lang, setLanguage: setLang } = useLanguage();
  const supabase = getSupabaseBrowser();

  const [view, setView] = useState<View>("overview");
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copiedAgreementId, setCopiedAgreementId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [successAgreementId, setSuccessAgreementId] = useState("");

  const [clientName, setClientName] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [contractTerms, setContractTerms] = useState("");
  const [totalPriceInput, setTotalPriceInput] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("single");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const lastPaymentStatusByIdRef = useRef<Record<string, Agreement["payment_status"]>>({});

  const tx = t[lang];
  const statusText: Record<DerivedAgreementStatus, string> = {
    pending: tx.pending,
    signed: tx.signed,
    completed: tx.completed,
    in_progress: tx.inProgress,
    paid: tx.paid,
    funds_secured: tx.fundsSecured
  };

  const getReleasedMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + (m.status === "released" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getEscrowHeldMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + (m.status === "escrow_held" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getPendingMilestoneAmount = (agreement: Agreement) => {
    if (agreement.payment_type !== "milestones") return 0;
    return (agreement.milestones ?? []).reduce(
      (sum, m) => sum + ((m.status ?? "pending") === "pending" ? Number(m.amount || 0) : 0),
      0
    );
  };

  const getReleaseProgress = (agreement: Agreement): { pct: number; released: number; escrow: number; pending: number } => {
    const total = Number(agreement.total_price || 0);
    if (agreement.payment_type === "milestones") {
      const released = getReleasedMilestoneAmount(agreement);
      const escrow = getEscrowHeldMilestoneAmount(agreement);
      const pending = Math.max(0, total - released - escrow);
      const pct = total > 0 ? Math.max(0, Math.min(100, (released / total) * 100)) : 0;
      return { pct, released, escrow, pending };
    }

    const released = agreement.payment_status === "released" ? total : 0;
    const escrow = agreement.payment_status === "escrow_held" ? total : 0;
    const pending = agreement.payment_status === "pending" ? total : 0;
    const pct = agreement.payment_status === "released" ? 100 : agreement.payment_status === "escrow_held" ? 50 : 0;
    return { pct, released, escrow, pending };
  };

  const getDerivedStatus = (agreement: Agreement): DerivedAgreementStatus => {
    if (agreement.payment_status === "released") return "paid";
    if (agreement.payment_status === "escrow_held") return "funds_secured";
    if (agreement.status === "completed") return "completed";
    if (agreement.payment_type === "milestones") {
      const milestones = agreement.milestones ?? [];
      const releasedCount = milestones.filter((m) => m.status === "released").length;
      if (milestones.length > 0 && releasedCount === milestones.length) return "completed";
      if (releasedCount > 0) return "in_progress";
    }
    if (agreement.status === "signed") return "signed";
    return "pending";
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/register?next=%2Fdashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!toast) return;
    const tm = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(tm);
  }, [toast]);

  useEffect(() => {
    if (!copiedAgreementId) return;
    const tm = window.setTimeout(() => setCopiedAgreementId(""), 1200);
    return () => window.clearTimeout(tm);
  }, [copiedAgreementId]);

  useEffect(() => {
    const prev = lastPaymentStatusByIdRef.current;
    let releasedDetected = false;
    for (const a of agreements) {
      if (prev[a.id] && prev[a.id] !== "released" && a.payment_status === "released") {
        releasedDetected = true;
      }
      prev[a.id] = a.payment_status;
    }
    if (releasedDetected) {
      setToast(tx.paymentReleasedBanner);
    }
  }, [agreements, tx.paymentReleasedBanner]);

  const totalPrice = useMemo(() => {
    const normalized = totalPriceInput.replaceAll(",", ".").replace(/[^0-9.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [totalPriceInput]);

  const milestonesParsed = useMemo(
    () =>
      milestones.map((m) => ({
        title: m.title.trim(),
        amount: Number(m.amount.replaceAll(",", ".").replace(/[^0-9.]/g, "")) || 0
      })),
    [milestones]
  );

  const milestonesTotal = useMemo(() => milestonesParsed.reduce((sum, item) => sum + item.amount, 0), [milestonesParsed]);
  const milestonesValid = paymentType === "single" || Math.abs(milestonesTotal - totalPrice) < 0.0001;

  const fetchAgreements = useCallback(async () => {
    if (!supabase || !user?.id) {
      setLoadingAgreements(false);
      return;
    }
    setLoadingAgreements(true);
    const { data, error: fetchError } = await supabase
      .from("agreements")
      .select("*")
      .eq("provider_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoadingAgreements(false);
      return;
    }

    setAgreements((data ?? []).map((row) => normalizeAgreementRow(row as Record<string, unknown>)) as Agreement[]);
    setLoadingAgreements(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    void fetchAgreements();
  }, [fetchAgreements]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const channel = supabase
      .channel(`agreements-dashboard-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agreements", filter: `provider_id=eq.${user.id}` },
        (payload) => {
          // Apply realtime row updates immediately so Signed/Paid badges change without refresh.
          if (payload.eventType === "DELETE" && payload.old?.id) {
            const deletedId = String(payload.old.id);
            setAgreements((prev) => prev.filter((a) => a.id !== deletedId));
            return;
          }

          if (payload.new) {
            const next = normalizeAgreementRow(payload.new as Record<string, unknown>) as Agreement;
            setAgreements((prev) => {
              const idx = prev.findIndex((a) => a.id === next.id);
              if (idx === -1) return [next, ...prev];
              const copy = [...prev];
              copy[idx] = next;
              return copy;
            });
          }

          // Fallback for strict consistency (ordering/derived totals).
          void fetchAgreements();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, fetchAgreements]);

  const copyAgreementLink = async (id: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://vstah.am";
    const link = `${base}/agreement/${id}`;
    await navigator.clipboard.writeText(link);
    setCopiedAgreementId(id);
  };

  const getAgreementPublicUrl = (id: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://vstah.am";
    return `${base}/agreement/${id}`;
  };

  const openAgreementLink = (id: string) => {
    window.open(getAgreementPublicUrl(id), "_blank", "noopener,noreferrer");
  };

  const downloadAgreementPdf = (agreement: Agreement) => {
    const link = `${getAgreementPublicUrl(agreement.id)}?download=1`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => {
    setClientName("");
    setProjectTitle("");
    setServiceArea("");
    setContractTerms("");
    setTotalPriceInput("");
    setPaymentType("single");
    setMilestones([]);
    setError("");
  };

  const buildDefaultTerms = (input: {
    providerName: string;
    clientName: string;
    serviceArea: string;
    totalPrice: number;
  }) =>
    [
      "SERVICE AGREEMENT",
      "",
      `This Agreement is made between ${input.providerName || "Service Provider"} (\"Provider\") and ${input.clientName} (\"Client\").`,
      `Service Area: ${input.serviceArea}.`,
      `Total Price: ${formatAMD(input.totalPrice)}.`,
      "",
      "Provider agrees to deliver services professionally and within the agreed scope and timeline.",
      "Client agrees to cooperate, provide access where required, and review delivered work in good faith.",
      "",
      "Funds will be released only upon client approval."
    ].join("\n");

  const submitAgreement = async () => {
    if (!user?.id || !supabase) {
      setError("You must be logged in to create an agreement.");
      return;
    }
    setError("");

    if (!clientName.trim() || !projectTitle.trim() || !serviceArea.trim() || totalPrice <= 0) {
      setError(tx.completeRequired);
      return;
    }

    if (paymentType === "milestones") {
      if (milestonesParsed.length === 0 || milestonesParsed.some((m) => !m.title || m.amount <= 0)) {
        setError(tx.completeMilestones);
        return;
      }
      if (!milestonesValid) {
        setError(tx.milestonesMismatch);
        return;
      }
    }

    setCreating(true);
    const providerName = user.email?.split("@")[0] || "Service Provider";
    const customTermsText =
      contractTerms.trim() ||
      buildDefaultTerms({
        providerName,
        clientName: clientName.trim(),
        serviceArea: serviceArea.trim(),
        totalPrice
      });
    const result = await insertAgreementWithSchemaFallback(supabase, {
      providerId: user.id,
      providerName,
      clientName: clientName.trim(),
      projectTitle: projectTitle.trim(),
      serviceArea: serviceArea.trim(),
      customTerms: customTermsText,
      totalPrice,
      paymentType,
      milestones: paymentType === "milestones" ? milestonesParsed : []
    });
    setCreating(false);

    if (result.error || !result.id) {
      setError(result.error ?? "Failed to create agreement.");
      return;
    }

    setSuccessAgreementId(result.id);
    setToast(tx.toastCreated);
    resetForm();
    setView("overview");
    await fetchAgreements();
  };

  const stats = useMemo(
    () => ({
      totalValue: agreements.reduce((sum, a) => sum + Number(a.total_price || 0), 0),
      signedCount: agreements.filter((a) => a.payment_status === "escrow_held" || a.payment_status === "released").length
    }),
    [agreements]
  );

  const archived = agreements.filter((a) => getDerivedStatus(a) === "completed");
  const listed = agreements.filter((a) => getDerivedStatus(a) !== "completed");
  const showClientSearch = listed.length > 15;
  const filteredListed = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();
    if (!query) return listed;
    return listed.filter((item) => item.client_name.toLowerCase().includes(query));
  }, [listed, clientSearch]);

  if (loading || !user) return <div className="min-h-screen bg-[#F9FAFB] p-6">Loading dashboard...</div>;

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] text-slate-900">
      <div className="flex h-full">
        <aside className="hidden h-screen w-72 min-w-[18rem] shrink-0 flex-col bg-[#0033A0] p-6 text-white lg:flex">
          <h1 className="text-2xl font-black">{tx.dashboardTitle}</h1>
          <p className="mt-2 text-sm text-blue-100">{tx.dashboardSubtitle}</p>
          <nav className="mt-8 space-y-2">
            {[
              { id: "overview" as const, label: tx.overview, icon: LayoutDashboard },
              { id: "create" as const, label: tx.createNewAgreement, icon: FilePlus2 },
              { id: "archive" as const, label: tx.archive, icon: Archive }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${view === id ? "bg-white text-[#0033A0]" : "text-blue-100 hover:bg-blue-700/40"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <p className="text-xs text-blue-100">{tx.signedInAs}: {user.email}</p>
            <button
              type="button"
              onClick={() => void signOut().then(() => router.replace("/login?next=%2Fdashboard"))}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#0033A0]"
            >
              {tx.logout}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-[#0033A0]">{view === "archive" ? tx.archivedTitle : tx.agreementsTitle}</h2>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
                    <span className="px-2 text-xs font-semibold text-slate-500">{tx.language}</span>
                    {(["en", "hy", "ru"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLang(code)}
                        className="rounded-md px-2 py-1 text-xs font-bold uppercase"
                        style={{ backgroundColor: lang === code ? "#F2A800" : "transparent", color: lang === code ? "#111827" : "#64748B" }}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setView("create")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900"
                >
                  <Plus className="h-4 w-4" />
                  {tx.createNewAgreement}
                </button>
              </div>
            </header>

            {view === "overview" ? (
              <>
                <section className="grid gap-4 md:grid-cols-2">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.totalAgreementValue}</p>
                    <p className="mt-2 text-3xl font-black">{formatAMD(stats.totalValue)}</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">{tx.signedAgreements}</p>
                    <p className="mt-2 text-3xl font-black">{stats.signedCount}</p>
                  </article>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {loadingAgreements ? (
                    <div className="inline-flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />{tx.loading}</div>
                  ) : listed.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <p className="font-semibold text-slate-800">{tx.emptyTitle}</p>
                      <p className="mt-1 text-sm text-slate-600">{tx.emptySubtitle}</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {showClientSearch ? (
                        <div className="mb-3">
                          <input
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            placeholder={tx.searchClientPlaceholder}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-sm"
                          />
                        </div>
                      ) : null}
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-3 py-2">{tx.clientName}</th>
                            <th className="px-3 py-2">{tx.price}</th>
                            <th className="px-3 py-2">{tx.releaseProgress}</th>
                            <th className="px-3 py-2">{tx.status}</th>
                            <th className="px-3 py-2">
                              <span className="sr-only">{tx.viewLink} / {tx.copyLink} / {tx.download}</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredListed.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                              <td className="px-3 py-3">{formatAMD(Number(item.total_price))}</td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const progress = getReleaseProgress(item);
                                  return (
                                    <div className="min-w-[190px]">
                                      <p className="mb-1 text-xs font-semibold text-slate-600">
                                        {formatAMD(progress.released)} / {formatAMD(Number(item.total_price || 0))} {tx.releasedOfTotal}
                                      </p>
                                      <p className="mb-1 text-[11px] font-semibold text-slate-500">
                                        {tx.vault}: {formatAMD(progress.escrow)} | {tx.waiting}: {formatAMD(progress.pending)}
                                      </p>
                                      <div className="h-2 w-full rounded-full bg-slate-200">
                                        <div
                                          className="h-2 rounded-full bg-orange-500 transition-all"
                                          style={{ width: `${progress.pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                {(() => {
                                  const derived = getDerivedStatus(item);
                                  const showSignedIndicator = item.status === "signed" && derived !== "paid" && derived !== "completed";
                                  const paid = item.payment_status === "released" || derived === "paid";
                                  const escrow =
                                    item.payment_status === "escrow_held" ||
                                    getEscrowHeldMilestoneAmount(item) > 0;
                                  const signedMark = item.status === "signed" || item.status === "completed";
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                        {paid ? (
                                          <span title={tx.paid}>✅</span>
                                        ) : (
                                          <>
                                            {signedMark ? <span title={tx.signed}>✍️</span> : null}
                                            {escrow ? <span title={tx.fundsSecured}>🔒</span> : null}
                                          </>
                                        )}
                                      </div>
                                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>
                                        {statusText[derived]}
                                      </span>
                                      {showSignedIndicator ? (
                                        <p className="text-xs font-semibold text-slate-500">{tx.signatureSigned}</p>
                                      ) : null}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  <button type="button" onClick={() => openAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.viewLink} title={tx.viewLink}>
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => void copyAgreementLink(item.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.copyLink} title={tx.copyLink}>
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button type="button" onClick={() => downloadAgreementPdf(item)} className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50" aria-label={tx.download} title={tx.download}>
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredListed.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                                {tx.noSearchResults}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            ) : null}

            {view === "create" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold">{tx.createSafeAgreement}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">{tx.clientName}<input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700">{tx.projectTitle}<input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">Service Area<input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">{tx.totalPrice}<input value={totalPriceInput} onChange={(e) => setTotalPriceInput(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" /></label>
                  <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                    Contract Terms
                    <textarea
                      value={contractTerms}
                      onChange={(e) => setContractTerms(e.target.value)}
                      rows={7}
                      placeholder="Add specific contract terms. If left empty, a professional default template will be used."
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-sm font-bold text-slate-900">{tx.milestones}</p><p className="text-xs text-slate-500">{tx.milestonesHint}</p></div>
                    <button type="button" onClick={() => setPaymentType((p) => (p === "single" ? "milestones" : "single"))} className={`inline-flex h-8 w-16 items-center rounded-full p-1 transition ${paymentType === "milestones" ? "bg-[#0033A0]" : "bg-slate-300"}`}><span className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${paymentType === "milestones" ? "translate-x-8" : "translate-x-0"}`} /></button>
                  </div>

                  {paymentType === "milestones" ? (
                    <div className="mt-4 space-y-3">
                      {milestones.map((m, index) => (
                        <div key={m.id} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                          <input value={m.title} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, title: e.target.value } : x)))} placeholder={`${tx.milestoneTitle} ${index + 1}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                          <input value={m.amount} onChange={(e) => setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, amount: e.target.value } : x)))} placeholder={tx.milestoneAmount} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" />
                          <button type="button" onClick={() => setMilestones((prev) => prev.filter((x) => x.id !== m.id))} className="inline-flex items-center justify-center rounded-lg border border-red-300 bg-white px-3 py-2 text-red-600" aria-label="Remove milestone"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setMilestones((prev) => [...prev, createMilestone()])} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><Plus className="h-4 w-4" />{tx.addMilestone}</button>
                      <p className={`text-xs font-semibold ${milestonesValid ? "text-slate-600" : "text-red-600"}`}>{tx.milestones}: {formatAMD(milestonesTotal)} / {tx.totalPrice}: {formatAMD(totalPrice || 0)}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">{tx.singlePayment}</p>
                  )}
                </div>

                {error ? <p className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}

                <div className="mt-5">
                  <button type="button" onClick={() => void submitAgreement()} disabled={creating} className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-black text-slate-900 disabled:opacity-60">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {creating ? tx.creating : tx.create}
                  </button>
                </div>
              </section>
            ) : null}

            {view === "archive" ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-extrabold">{tx.completedAgreements}</h3>
                {archived.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">{tx.noCompleted}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">{tx.clientName}</th>
                          <th className="px-3 py-2">{tx.price}</th>
                          <th className="px-3 py-2">{tx.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archived.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-3 py-3 font-semibold">{item.client_name}</td>
                            <td className="px-3 py-3">{formatAMD(Number(item.total_price))}</td>
                            <td className="px-3 py-3">
                              {(() => {
                                const derived = getDerivedStatus(item);
                                const paid = item.payment_status === "released" || derived === "paid";
                                const escrow =
                                  item.payment_status === "escrow_held" ||
                                  getEscrowHeldMilestoneAmount(item) > 0;
                                const signedMark = item.status === "signed" || item.status === "completed";
                                return (
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5 text-base leading-none" aria-hidden>
                                      {paid ? (
                                        <span title={tx.paid}>✅</span>
                                      ) : (
                                        <>
                                          {signedMark ? <span title={tx.signed}>✍️</span> : null}
                                          {escrow ? <span title={tx.fundsSecured}>🔒</span> : null}
                                        </>
                                      )}
                                    </div>
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge[derived]}`}>
                                      {statusText[derived]}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </main>
      </div>

      {successAgreementId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-xl font-extrabold text-emerald-700">{tx.successTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{tx.successSubtitle}</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">{tx.publicLink}</p>
              <p className="mt-1 break-all text-sm font-bold text-slate-900">{typeof window !== "undefined" ? `${window.location.origin}/agreement/${successAgreementId}` : `/agreement/${successAgreementId}`}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyAgreementLink(successAgreementId)} className="inline-flex items-center gap-2 rounded-xl bg-[#F2A800] px-4 py-2 text-sm font-bold text-slate-900"><Copy className="h-4 w-4" />{copiedAgreementId === successAgreementId ? tx.copied : tx.copyToClipboard}</button>
              <button type="button" onClick={() => setSuccessAgreementId("")} className="ml-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{tx.close}</button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div> : null}
    </div>
  );
}

```


---

### `app/dashboard/actions.ts`

```typescript
"use server";

import { createClient } from "@supabase/supabase-js";

type CreateAgreementInput = {
  providerId: string;
  clientName: string;
  projectTitle: string;
  totalPrice: number;
  paymentType: "single" | "milestones";
  milestones: { title: string; amount: number }[];
};

type CreateAgreementResult = {
  id?: string;
  error?: string;
};

export async function createAgreementAction(input: CreateAgreementInput): Promise<CreateAgreementResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { error: "Supabase is not configured." };
  }

  if (!input.providerId || !input.clientName || !input.projectTitle || input.totalPrice <= 0) {
    return { error: "Please fill all required fields." };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("agreements")
    .insert({
      provider_id: input.providerId,
      client_name: input.clientName,
      project_title: input.projectTitle,
      total_price: input.totalPrice,
      payment_type: input.paymentType,
      milestones: input.paymentType === "milestones" ? input.milestones : [],
      status: "pending"
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message ?? "Failed to create agreement." };
  }

  return { id: data.id as string };
}

```


---

### `app/agreement/[id]/page.tsx`

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";
import { useLanguage } from "@/lib/i18n/language-context";
import { normalizeAgreementRow } from "@/lib/agreements/row";

async function postAgreementAction(
  agreementId: string,
  subpath: "/sign" | "/deposit" | "/release",
  body: Record<string, unknown> = {}
): Promise<{ ok: boolean; status: number; error?: string; code?: string; alreadySigned?: boolean }> {
  const res = await fetch(`/api/agreement/${encodeURIComponent(agreementId)}${subpath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    ok?: boolean;
    alreadySigned?: boolean;
  };
  return { ok: res.ok, status: res.status, ...data };
}

type AgreementStatus = "pending" | "signed" | "completed";
type Agreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  total_price: number;
  payment_type: "single" | "milestones";
  milestones: { title: string; amount: number; status?: "pending" | "escrow_held" | "released" }[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  created_at: string;
};

const money = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function AgreementClientPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const shouldAutoDownload = searchParams.get("download") === "1";
  /** Remount when navigating between agreement IDs so state and effects match the URL. */
  const routeKey = typeof id === "string" && id.length > 0 ? id : "pending";
  const supabase = getSupabaseBrowser();
  const { language } = useLanguage();
  const tx =
    language === "hy"
      ? {
          loading: "Պայմանագիրը բեռնվում է...",
          notConfigured: "Supabase-ը կարգավորված չէ։",
          notFound: "Պայմանագիրը չի գտնվել։",
          offer: "VSTAH Առաջարկ",
          title: "Անվտանգ ծառայության պայմանագիր",
          subtitle: "Ստորագրելուց առաջ ստուգեք ստորև նշված բոլոր տվյալները։",
          client: "Հաճախորդ",
          project: "Նախագիծ / Ծառայություն",
          total: "Ընդհանուր գին",
          status: "Կարգավիճակ",
          paymentType: "Վճարման տեսակ",
          milestones: "Փուլեր",
          milestonesValue: "Փուլային",
          singleValue: "Մեկանգամյա",
          optionalSignature: "Ընտրովի ստորագրություն",
          signatureHint: "Ստորագրեք ներքևում և սեղմեք «Ստորագրել և ընդունել պայմանագիրը»։",
          clearSignature: "Մաքրել ստորագրությունը",
          signing: "Ստորագրվում է...",
          signAndAccept: "Ստորագրել և ընդունել պայմանագիրը",
          signedSuccess: "Պայմանագիրը հաջողությամբ ստորագրվեց։ Մատակարարը ծանուցվել է։",
          signedByClient: "Ստորագրել է հաճախորդը",
          signFailed: "Չհաջողվեց ստորագրել պայմանագիրը։ Փորձեք կրկին։",
          signBlocked:
            "Պահեստը թույլ չի տալիս պահել ստորագրությունը։ Սերվերում ավելացրեք SUPABASE_SERVICE_ROLE_KEY կամ թարմացրեք Supabase RLS քաղաքականությունները։",
          releaseMilestone: "Արձակել փուլը",
          releasingMilestone: "Արձակվում է...",
          depositMilestone: "Դեպոզիտ",
          depositingMilestone: "Դեպոզիտ է կատարվում...",
          escrowHeld: "Պահվում է էսկրոուում",
          releaseTotalPayment: "Արձակել ամբողջ վճարումը",
          releasingTotalPayment: "Վճարումն ընթացքի մեջ է...",
          depositEscrow: "Դեպոզիտ 100,000 ֏ էսկրոուում",
          depositingEscrow: "Դեպոզիտ է կատարվում...",
          paid: "Վճարված",
          pendingMilestone: "Սպասման մեջ",
          paymentSuccessful: "Payment Released! The provider has been notified.",
          transactionComplete: "Transaction Complete",
          transactionCompleteBody: "All payment obligations have been fulfilled. This agreement is now closed.",
          paidInFull: "PAID IN FULL",
          backHome: "Back to Home",
          agreementPhase: "Պայմանագիր",
          paymentPhase: "Վճարում",
          phaseAwaitingSign: "Սպասում է ստորագրման",
          phaseSigned: "Ստորագրված",
          phaseCompleted: "Ավարտված",
          phasePayPending: "Սպասում է դեպոզիտի",
          phasePayEscrow: "Միջոցները ապահովված են",
          phasePayReleased: "Արձակված է",
          depositTotalToEscrow: "Դեպոզիտել ընդհանուրը էսկրոուում",
          agreementId: "Պայմանագրի ID",
          creationDate: "Ստեղծման ամսաթիվ",
          providerDetails: "Մատակարարի տվյալներ",
          clientDetails: "Հաճախորդի տվյալներ",
          termsAndConditions: "Պայմաններ և դրույթներ",
          name: "Անուն",
          serviceAreaLabel: "Սպասարկման տարածք",
          statusSigned: "Ստորագրված",
          statusPending: "Սպասման մեջ",
          previousMilestoneNotFinished: "Նախորդ փուլը դեռ ավարտված չէ։ Ցանկանու՞մ եք այս փուլը դեպոզիտ անել հերթից դուրս։",
          releaseMilestoneFailed: "Չհաջողվեց արձակել փուլի գումարը։ Փորձեք կրկին։",
          depositMilestoneFailed: "Չհաջողվեց դեպոզիտ կատարել այս փուլի համար։ Փորձեք կրկին։",
          releasePaymentFailed: "Չհաջողվեց արձակել վճարումը։ Փորձեք կրկին։",
          depositEscrowFailed: "Չհաջողվեց դեպոզիտ անել էսկրոուում։ Փորձեք կրկին։"
        }
      : language === "ru"
        ? {
            loading: "Загрузка соглашения...",
            notConfigured: "Supabase не настроен.",
            notFound: "Соглашение не найдено.",
            offer: "Предложение VSTAH",
            title: "Безопасное сервисное соглашение",
            subtitle: "Проверьте все детали ниже перед подтверждением.",
            client: "Клиент",
            project: "Проект / Услуга",
            total: "Общая стоимость",
            status: "Статус",
            paymentType: "Тип оплаты",
            milestones: "Этапы",
            milestonesValue: "По этапам",
            singleValue: "Единовременно",
            optionalSignature: "Подпись (необязательно)",
            signatureHint: "Поставьте подпись ниже и нажмите «Подписать и принять соглашение».",
            clearSignature: "Очистить подпись",
            signing: "Подписание...",
            signAndAccept: "Подписать и принять соглашение",
            signedSuccess: "Соглашение успешно подписано! Исполнитель уведомлен.",
            signedByClient: "Подписано клиентом",
            signFailed: "Не удалось подписать соглашение. Попробуйте снова.",
            signBlocked:
              "База данных блокирует обновление. Добавьте SUPABASE_SERVICE_ROLE_KEY на сервер или настройте политики RLS в Supabase.",
            releaseMilestone: "Выплатить этап",
            releasingMilestone: "Выплата...",
            depositMilestone: "Депозит",
            depositingMilestone: "Внесение...",
            escrowHeld: "В эскроу",
            releaseTotalPayment: "Выплатить всю сумму",
            releasingTotalPayment: "Платеж обрабатывается...",
            depositEscrow: "Депозит 100,000 ֏ в эскроу",
            depositingEscrow: "Внесение депозита...",
            paid: "Оплачено",
            pendingMilestone: "Ожидает",
            paymentSuccessful: "Payment Released! The provider has been notified.",
            transactionComplete: "Transaction Complete",
            transactionCompleteBody: "All payment obligations have been fulfilled. This agreement is now closed.",
            paidInFull: "PAID IN FULL",
            backHome: "Back to Home",
            agreementPhase: "Соглашение",
            paymentPhase: "Оплата",
            phaseAwaitingSign: "Ожидает подписи",
            phaseSigned: "Подписано",
            phaseCompleted: "Завершено",
            phasePayPending: "Ожидает депозита",
            phasePayEscrow: "Средства в эскроу",
            phasePayReleased: "Выплачено",
            depositTotalToEscrow: "Внести всю сумму в эскроу",
            agreementId: "ID соглашения",
            creationDate: "Дата создания",
            providerDetails: "Данные исполнителя",
            clientDetails: "Данные клиента",
            termsAndConditions: "Условия соглашения",
            name: "Имя",
            serviceAreaLabel: "Регион обслуживания",
            statusSigned: "Подписано",
            statusPending: "Ожидает",
            previousMilestoneNotFinished: "Предыдущий этап еще не завершен. Хотите внести депозит за этот этап вне очереди?",
            releaseMilestoneFailed: "Не удалось выплатить этап. Попробуйте снова.",
            depositMilestoneFailed: "Не удалось внести депозит за этот этап. Попробуйте снова.",
            releasePaymentFailed: "Не удалось выплатить средства. Попробуйте снова.",
            depositEscrowFailed: "Не удалось внести средства в эскроу. Попробуйте снова."
          }
        : {
            loading: "Loading agreement...",
            notConfigured: "Supabase is not configured.",
            notFound: "Agreement not found.",
            offer: "VSTAH Offer",
            title: "Safe Service Agreement",
            subtitle: "Review all details below before accepting this offer.",
            client: "Client",
            project: "Project / Service",
            total: "Total Price",
            status: "Status",
            paymentType: "Payment Type",
            milestones: "Milestones",
            milestonesValue: "Milestones",
            singleValue: "Single",
            optionalSignature: "Optional Signature",
            signatureHint: "Draw your signature below and then click Sign & Accept Agreement.",
            clearSignature: "Clear Signature",
            signing: "Signing...",
            signAndAccept: "Sign & Accept Agreement",
            signedSuccess: "Agreement Signed Successfully! The provider has been notified.",
            signedByClient: "Signed by client",
            signFailed: "Failed to sign agreement. Please try again.",
            signBlocked:
              "Signing could not be saved (database blocked the update). Add SUPABASE_SERVICE_ROLE_KEY to your server env, or adjust Supabase RLS policies for agreements.",
            releaseMilestone: "Release Milestone",
            releasingMilestone: "Releasing...",
            depositMilestone: "Deposit Funds",
            depositingMilestone: "Depositing...",
            escrowHeld: "In Vault",
            releaseTotalPayment: "Release Total Payment",
            releasingTotalPayment: "Processing payment...",
            depositEscrow: "Deposit 100,000 ֏ to Escrow",
            depositingEscrow: "Depositing to escrow...",
            paid: "Paid",
            pendingMilestone: "Pending",
            paymentSuccessful: "Payment Released! The provider has been notified.",
            transactionComplete: "Transaction Complete",
            transactionCompleteBody: "All payment obligations have been fulfilled. This agreement is now closed.",
            paidInFull: "PAID IN FULL",
            backHome: "Back to Home",
            agreementPhase: "Agreement",
            paymentPhase: "Payment",
            phaseAwaitingSign: "Awaiting signature",
            phaseSigned: "Signed",
            phaseCompleted: "Completed",
            phasePayPending: "Awaiting deposit",
            phasePayEscrow: "Funds in escrow",
            phasePayReleased: "Released",
            depositTotalToEscrow: "Deposit total to escrow",
            agreementId: "Agreement ID",
            creationDate: "Creation Date",
            providerDetails: "Provider Details",
            clientDetails: "Client Details",
            termsAndConditions: "Terms and Conditions",
            name: "Name",
            serviceAreaLabel: "Service Area",
            statusSigned: "Signed",
            statusPending: "Pending",
            previousMilestoneNotFinished: "Previous milestone is not finished yet. Do you want to deposit this milestone ahead of schedule?",
            releaseMilestoneFailed: "Failed to release milestone. Please try again.",
            depositMilestoneFailed: "Failed to deposit funds for this milestone. Please try again.",
            releasePaymentFailed: "Failed to release payment. Please try again.",
            depositEscrowFailed: "Failed to deposit funds to escrow. Please try again."
          };

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [releasingMilestoneIndex, setReleasingMilestoneIndex] = useState<number | null>(null);
  const [depositingMilestoneIndex, setDepositingMilestoneIndex] = useState<number | null>(null);
  const [depositingEscrow, setDepositingEscrow] = useState(false);
  /** Fatal: not configured / not found (no agreement to show). */
  const [error, setError] = useState("");
  /** Non-fatal: sign / payment actions while agreement is visible. */
  const [actionError, setActionError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const printableRef = useRef<HTMLDivElement | null>(null);
  const downloadTriggeredRef = useRef(false);

  const fetchAgreement = useCallback(async () => {
    if (!id) return;
    if (!supabase) {
      setError(tx.notConfigured);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase.from("agreements").select("*").eq("id", id).single();

    if (fetchError || !data) {
      setError(tx.notFound);
      setLoading(false);
      return;
    }

    const normalized = normalizeAgreementRow(data as Record<string, unknown>);
    setAgreement(normalized as Agreement);
    setError("");
    setActionError("");
    setLoading(false);
  }, [id, supabase, tx.notConfigured, tx.notFound]);

  useEffect(() => {
    setLoading(true);
    void fetchAgreement();
  }, [fetchAgreement]);

  useEffect(() => {
    if (!supabase || !id) return;
    const channel = supabase
      .channel(`agreement-public-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agreements", filter: `id=eq.${id}` }, (payload) => {
        if (payload.new || payload.old) {
          void fetchAgreement();
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, id, fetchAgreement]);

  useEffect(() => {
    const onVisibleOrFocus = () => {
      if (document.visibilityState === "visible") {
        void fetchAgreement();
      }
    };
    window.addEventListener("focus", onVisibleOrFocus);
    document.addEventListener("visibilitychange", onVisibleOrFocus);
    return () => {
      window.removeEventListener("focus", onVisibleOrFocus);
      document.removeEventListener("visibilitychange", onVisibleOrFocus);
    };
  }, [fetchAgreement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const tryClientUpdate = async (
    payload: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase || !agreement) return { ok: false, error: tx.signBlocked };
    const run = async (candidatePayload: Record<string, unknown>) =>
      supabase
        .from("agreements")
        .update(candidatePayload)
        .eq("id", agreement.id)
        .select("id");

    let { data: updatedRows, error: updateError } = await run(payload);
    const paymentStatus = payload.payment_status;
    if (
      updateError &&
      paymentStatus === "released" &&
      (updateError.message?.toLowerCase().includes("check_payment_status") ||
        updateError.message?.toLowerCase().includes("payment_status"))
    ) {
      // Compatibility for DBs that still use `paid` instead of `released`.
      ({ data: updatedRows, error: updateError } = await run({ ...payload, payment_status: "paid" }));
    }

    if (updateError || !updatedRows?.length) {
      return { ok: false, error: updateError?.message || tx.signBlocked };
    }

    return { ok: true };
  };

  const signAgreement = async () => {
    if (!agreement || signing || agreement.status === "signed" || agreement.status === "completed") return;

    setSigning(true);
    setActionError("");
    const signature = canvasRef.current?.toDataURL("image/png") ?? null;

    const res = await postAgreementAction(agreement.id, "/sign", { signature: signature ?? undefined });
    if (!res.ok && !res.alreadySigned) {
      const fallback = await tryClientUpdate({ status: "signed" });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.signBlocked);
        setSigning(false);
        return;
      }
    }

    await fetchAgreement();
    setSigning(false);
  };

  const releaseMilestone = async (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "escrow_held") return;

    setReleasingMilestoneIndex(index);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/release", { milestoneIndex: index });
    if (!res.ok) {
      const nextMilestones = current.map((m, i) => (i === index ? { ...m, status: "released" as const } : m));
      const allReleased = nextMilestones.every((m) => m.status === "released");
      const fallback = await tryClientUpdate({
        milestones: nextMilestones,
        payment_status: allReleased ? "released" : "escrow_held",
        status: allReleased ? "completed" : "signed"
      });
      if (!fallback.ok) {
      setActionError(res.error || fallback.error || tx.releaseMilestoneFailed);
        setReleasingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setReleasingMilestoneIndex(null);
  };

  const depositMilestone = async (index: number) => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_type !== "milestones") return;
    const current = agreement.milestones ?? [];
    const target = current[index];
    if (!target || target.status !== "pending") return;

    let confirmOutOfOrder = false;
    if (index > 0) {
      const previous = current[index - 1];
      if (previous?.status !== "released") {
        const payAhead = window.confirm(tx.previousMilestoneNotFinished);
        if (!payAhead) return;
        confirmOutOfOrder = true;
      }
    }

    setDepositingMilestoneIndex(index);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/deposit", { milestoneIndex: index, confirmOutOfOrder });
    if (res.status === 409 && res.code === "OUT_OF_ORDER" && !confirmOutOfOrder) {
      setDepositingMilestoneIndex(null);
      const payAhead = window.confirm(tx.previousMilestoneNotFinished);
      if (!payAhead) return;
      setDepositingMilestoneIndex(index);
      const retry = await postAgreementAction(agreement.id, "/deposit", {
        milestoneIndex: index,
        confirmOutOfOrder: true
      });
      if (!retry.ok) {
        setActionError(retry.error || tx.depositMilestoneFailed);
        setDepositingMilestoneIndex(null);
        return;
      }
      await fetchAgreement();
      setDepositingMilestoneIndex(null);
      return;
    }
    if (!res.ok) {
      const nextMilestones = current.map((m, i) => ({
        ...m,
        status: i === index ? "escrow_held" : m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
      }));
      const fallback = await tryClientUpdate({
        milestones: nextMilestones,
        payment_status: "escrow_held"
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.depositMilestoneFailed);
        setDepositingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setDepositingMilestoneIndex(null);
  };

  const releaseTotalPayment = async () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "escrow_held") return;
    setReleasingMilestoneIndex(-1);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/release", {});
    if (!res.ok) {
      const fallback = await tryClientUpdate({
        payment_status: "released",
        status: "completed"
      });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.releasePaymentFailed);
        setReleasingMilestoneIndex(null);
        return;
      }
    }

    await fetchAgreement();
    setReleasingMilestoneIndex(null);
  };

  const depositToEscrow = async () => {
    if (!agreement || agreement.status !== "signed" || agreement.payment_status !== "pending" || depositingEscrow) return;
    setDepositingEscrow(true);
    setActionError("");
    const res = await postAgreementAction(agreement.id, "/deposit", {});
    if (!res.ok) {
      const fallback = await tryClientUpdate({ payment_status: "escrow_held" });
      if (!fallback.ok) {
        setActionError(res.error || fallback.error || tx.depositEscrowFailed);
        setDepositingEscrow(false);
        return;
      }
    }

    await fetchAgreement();
    setDepositingEscrow(false);
  };

  const defaultTerms = [
    "SERVICE AGREEMENT",
    "",
    `This Agreement is made between ${agreement?.provider_name || "Service Provider"} (\"Provider\") and ${agreement?.client_name || "Client"} (\"Client\").`,
    `Service Area: ${agreement?.service_area || "As agreed by the parties"}.`,
    `Total Price: ${money(Number(agreement?.total_price || 0))} ֏.`,
    "",
    "Provider agrees to deliver services professionally and within the agreed scope and timeline.",
    "Client agrees to cooperate, provide access where required, and review delivered work in good faith.",
    "",
    "Funds will be released only upon client approval."
  ].join("\n");

  const downloadRenderedAgreement = useCallback(async () => {
    const node = printableRef.current;
    if (!node || !agreement) return;

    const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
    const imageData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`agreement-${agreement.id}.pdf`);
  }, [agreement]);

  useEffect(() => {
    if (!shouldAutoDownload || loading || !agreement) return;
    if (downloadTriggeredRef.current) return;
    downloadTriggeredRef.current = true;
    window.setTimeout(() => {
      void downloadRenderedAgreement();
    }, 450);
  }, [shouldAutoDownload, loading, agreement, downloadRenderedAgreement]);

  if (loading) {
    return (
      <main key={routeKey} className="min-h-screen bg-[#F9FAFB] p-6 text-slate-700">
        <div className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {tx.loading}
        </div>
      </main>
    );
  }

  if (!agreement) {
    return (
      <main key={routeKey} className="min-h-screen bg-[#F9FAFB] p-6 text-red-700">
        {error || tx.notFound}
      </main>
    );
  }

  const signed = agreement.status === "signed" || agreement.status === "completed";
  const paymentReleased = agreement.payment_status === "released";

  return (
    <main key={routeKey} className="min-h-screen bg-slate-100 px-3 py-6 md:px-6 md:py-10">
      <div ref={printableRef} className="relative mx-auto w-full max-w-[880px] rounded-md border border-slate-200 bg-white px-4 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] md:px-10 md:py-9">
        {paymentReleased ? (
          <div className="pointer-events-none absolute right-4 top-6 rotate-[-12deg] rounded border-4 border-emerald-600 px-3 py-1.5 text-xs font-black tracking-widest text-emerald-700 opacity-90 md:right-8 md:top-8 md:text-sm">
            {tx.paidInFull}
          </div>
        ) : null}
        {actionError ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800"
          >
            {actionError}
          </div>
        ) : null}

        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{tx.offer}</p>
          <h1 className="mt-2 text-2xl font-black text-[#0033A0] md:text-3xl">{tx.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{tx.subtitle}</p>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.agreementId}</p>
            <p className="mt-1 font-semibold">{agreement.id}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.creationDate}</p>
            <p className="mt-1 font-semibold">{new Date(agreement.created_at).toLocaleDateString()}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.agreementPhase}</p>
            <p className="mt-1 font-bold text-slate-900">
              {agreement.status === "pending"
                ? tx.phaseAwaitingSign
                : agreement.status === "completed"
                  ? tx.phaseCompleted
                  : tx.phaseSigned}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.paymentPhase}</p>
            <p className="mt-0.5 font-bold text-slate-900">
              {agreement.payment_status === "released"
                ? tx.phasePayReleased
                : agreement.payment_status === "escrow_held"
                  ? tx.phasePayEscrow
                  : tx.phasePayPending}
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.providerDetails}</p>
            <p className="mt-2"><span className="font-semibold">{tx.name}:</span> {agreement.provider_name || "Service Provider"}</p>
            <p><span className="font-semibold">{tx.serviceAreaLabel}:</span> {agreement.service_area || "As agreed"}</p>
          </div>
          <div className="rounded border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx.clientDetails}</p>
            <p className="mt-2"><span className="font-semibold">{tx.client}:</span> {agreement.client_name}</p>
            <p><span className="font-semibold">{tx.project}:</span> {agreement.project_title}</p>
            <p><span className="font-semibold">{tx.total}:</span> {money(Number(agreement.total_price))} ֏</p>
          </div>
        </section>

        <section className="mt-6 rounded border border-slate-200 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.termsAndConditions}</p>
          <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-700">
            {agreement.custom_terms?.trim() || defaultTerms}
          </pre>
        </section>

        {agreement.payment_type === "milestones" ? (
          <section className="mt-6 rounded border border-slate-200 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-700">{tx.milestones}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {(agreement.milestones ?? []).map((m, i) => (
                <li key={`${m.title}-${i}`} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      {i + 1}. {m.title} - {money(Number(m.amount || 0))} ֏
                    </p>
                    <div className="flex items-center gap-2">
                      {m.status === "released" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tx.paid}
                        </span>
                      ) : m.status === "escrow_held" ? (
                        <>
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#0033A0]">
                            {tx.escrowHeld}
                          </span>
                          {agreement.status === "signed" ? (
                            <button
                              type="button"
                              onClick={() => void releaseMilestone(i)}
                              disabled={releasingMilestoneIndex === i}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {releasingMilestoneIndex === i ? tx.releasingMilestone : tx.releaseMilestone}
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                            {tx.pendingMilestone}
                          </span>
                          {agreement.status === "signed" ? (
                            <button
                              type="button"
                              onClick={() => void depositMilestone(i)}
                              disabled={depositingMilestoneIndex === i}
                              className="rounded-lg bg-[#0033A0] px-2.5 py-1 text-xs font-bold text-white transition hover:opacity-95 disabled:opacity-60"
                            >
                              {depositingMilestoneIndex === i ? tx.depositingMilestone : tx.depositMilestone}
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!paymentReleased && agreement.status === "signed" && agreement.payment_status === "pending" && (agreement.milestones ?? []).length === 0 ? (
          <button
            type="button"
            onClick={() => void depositToEscrow()}
            disabled={depositingEscrow}
            className="mt-6 w-full rounded-xl bg-[#0033A0] px-5 py-3 text-base font-black text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {depositingEscrow ? (
              tx.depositingEscrow
            ) : (
              <span className="flex flex-col items-center gap-0.5 leading-tight">
                <span>{tx.depositTotalToEscrow}</span>
                <span className="text-sm font-bold opacity-95">{money(Number(agreement.total_price))} ֏</span>
              </span>
            )}
          </button>
        ) : null}

        {!paymentReleased && agreement.status === "signed" && agreement.payment_status === "escrow_held" && (agreement.milestones ?? []).length === 0 ? (
          <button
            type="button"
            onClick={() => void releaseTotalPayment()}
            disabled={releasingMilestoneIndex === -1}
            className="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3 text-base font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {releasingMilestoneIndex === -1 ? tx.releasingTotalPayment : tx.releaseTotalPayment}
          </button>
        ) : null}

        {agreement.status === "pending" ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">{tx.optionalSignature}</p>
            <p className="mt-1 text-xs text-slate-500">{tx.signatureHint}</p>
            <canvas
              ref={canvasRef}
              width={640}
              height={180}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDraw}
              onPointerLeave={stopDraw}
              className="mt-3 h-40 w-full touch-none rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={clearSignature}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              {tx.clearSignature}
            </button>
            <button
              type="button"
              onClick={() => void signAgreement()}
              disabled={signing}
              className="mt-4 w-full rounded-xl bg-[#F2A800] px-5 py-3 text-base font-black text-slate-900 transition hover:opacity-95 disabled:opacity-60"
            >
              {signing ? tx.signing : tx.signAndAccept}
            </button>
          </div>
        ) : null}

        {signed ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <p className="inline-flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-5 w-5" />
              {tx.signedSuccess}
            </p>
            <p className="mt-1 text-sm font-semibold">
              {tx.signedByClient}: {agreement.client_name}
            </p>
          </div>
        ) : null}

        {paymentReleased ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
            <p className="font-bold">{tx.paymentSuccessful}</p>
            <p className="mt-1 text-sm font-semibold">{tx.transactionComplete}</p>
            <p className="mt-1 text-sm">{tx.transactionCompleteBody}</p>
            <div className="mt-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-50"
              >
                {tx.backHome}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

```


---

### `app/deal/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";

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
    if (status === "pending_deposit") return "Pending Deposit";
    if (status === "funds_secured") return "Funds Secured";
    if (status === "payment_requested") return "Payment Requested";
    if (status === "completed") return "Completed";
    return "Draft";
  };

  const canApprove = deal?.status === "funds_secured" || deal?.status === "payment_requested";

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      if (!supabase) {
        setError("Supabase is not configured.");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("deals")
        .select("id, client_name, project_title, total_price, terms, status, created_at")
        .eq("id", id)
        .single();

      if (fetchError || !data) {
        setError("Agreement not found.");
        setLoading(false);
        return;
      }

      setDeal(data as Deal);
      setLoading(false);
    };

    void run();
  }, [id, supabase]);

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

    const confirmed = window.confirm(
      "Are you sure the work is completed? This will authorize VSTAH to pay the contractor."
    );
    if (!confirmed) return;

    setApproving(true);
    const { error: updateError } = await supabase
      .from("deals")
      .update({ status: "completed" })
      .eq("id", id);

    if (updateError) {
      setError("Failed to approve payment. Please try again.");
      setApproving(false);
      return;
    }

    setDeal((prev) => (prev ? { ...prev, status: "completed" } : prev));
    setToast("Payment approved and released.");
    setApproving(false);
  };

  if (loading) {
    return <main className="min-h-screen bg-[#F9FAFB] p-6 text-slate-700">Loading agreement...</main>;
  }

  if (error || !deal) {
    return <main className="min-h-screen bg-[#F9FAFB] p-6 text-red-700">{error || "Agreement not found."}</main>;
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-black text-[#0033A0]">VSTAH Safe Agreement</h1>
        <p className="mt-2 text-sm text-slate-600">Please review the agreement details and follow payment instructions.</p>

        <div className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-semibold">Agreement ID:</span> {deal.id}</p>
          <p><span className="font-semibold">Client:</span> {deal.client_name}</p>
          <p><span className="font-semibold">Project:</span> {deal.project_title}</p>
          <p><span className="font-semibold">Total:</span> {Number(deal.total_price).toLocaleString("en-US")} AMD</p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${badgeStyle[deal.status]}`}>
              {statusLabel(deal.status)}
            </span>
          </p>
          <p><span className="font-semibold">Created:</span> {new Date(deal.created_at).toLocaleString()}</p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Terms</p>
          <p className="mt-2 whitespace-pre-wrap">{deal.terms}</p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Payment Instructions</p>
          <p className="mt-1">
            Sign by proceeding with the protected deposit flow. Funds remain held in escrow until milestones are approved.
          </p>
        </div>

        {canApprove ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => void approveAndRelease()}
              disabled={approving}
              className="w-full rounded-xl bg-[#F2A800] px-5 py-4 text-base font-black text-slate-900 shadow-sm transition hover:opacity-95 disabled:opacity-60"
            >
              {approving ? "Approving..." : "Approve & Release Payment"}
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

```


---

### `app/terms/page.tsx`

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { NAVY } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service | VSTAH.am",
  description:
    "Terms governing the use of VSTAH.am and the escrow flow between homeowners and contractors in Armenia."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-10">
        <Link href="/" className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline">
          Back to home
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
          Terms & Conditions
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
          These terms govern the use of VSTAH.am and the escrow flow between homeowners and contractors.
          By using the platform, you agree to comply with applicable Armenian laws and platform policies.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 md:text-base">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Platform role</h2>
            <p className="mt-2">
              VSTAH.am provides escrow tooling, milestone tracking, and dispute support. We do not perform the
              renovation work and are not a party to construction execution obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. Payments & release</h2>
            <p className="mt-2">
              Funds are released by milestone according to approvals and submitted evidence. In case of disputes,
              funds remain protected until a resolution is recorded on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Dispute resolution</h2>
            <p className="mt-2">
              If parties cannot reach agreement, mediation processes defined in your deal settings and applicable law
              are used to determine the next action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Contact</h2>
            <p className="mt-2">
              For legal or account-related issues, contact us at{" "}
              <a href="tel:+37411550550" className="font-semibold text-slate-900">
                +374 11 550 550
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

```


---

### `app/privacy/page.tsx`

```tsx
"use client";

import Link from "next/link";
import { NAVY } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800 md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-10">
        <Link href="/" className="text-sm font-semibold text-slate-600 underline-offset-4 hover:underline">
          Back to home
        </Link>

        <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl" style={{ color: NAVY }}>
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
          This policy explains how VSTAH.am collects, uses, and protects personal information from homeowners,
          contractors, and invited participants using the platform.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 md:text-base">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1. Data we collect</h2>
            <p className="mt-2">
              We may collect account details, project and deal information, communication metadata, and transaction
              records needed to provide escrow services and dispute support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2. How we use data</h2>
            <p className="mt-2">
              Data is used to operate the platform, protect funds, authenticate users, prevent abuse, and comply with
              legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3. Data sharing</h2>
            <p className="mt-2">
              Information is shared only when required to deliver platform features, support dispute resolution,
              process payments, or meet legal/regulatory requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4. Contact</h2>
            <p className="mt-2">
              For privacy requests or questions, contact us at{" "}
              <a href="tel:+37411550550" className="font-semibold text-slate-900">
                +374 11 550 550
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

```


---

### `app/error.tsx`

```tsx
"use client";

import { NAVY, ORANGE } from "@/lib/brand";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-white"
      style={{ backgroundColor: NAVY }}
    >
      <h1 className="text-2xl font-black tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-white/85">
        This is often a stale build cache (especially if the project folder syncs with OneDrive). Try{" "}
        <strong className="text-white">npm run dev:clean</strong> or delete the <code className="rounded bg-white/10 px-1">.next</code>{" "}
        folder, then run <code className="rounded bg-white/10 px-1">npm run dev</code> again.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="max-w-lg break-all text-xs text-white/60">{error.message}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl px-6 py-3 text-sm font-bold text-slate-900 shadow-lg"
          style={{ backgroundColor: ORANGE }}
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          Home
        </a>
      </div>
    </div>
  );
}

```


---

### `app/api/agreement/[id]/sign/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  const { supabase } = client;

  const { data: existing, error: readError } = await supabase
    .from("agreements")
    .select("id,status")
    .eq("id", agreementId)
    .single();

  if (readError || !existing) {
    return NextResponse.json({ error: readError?.message ?? "Agreement not found." }, { status: 404 });
  }

  if (existing.status === "signed" || existing.status === "completed") {
    return NextResponse.json({ ok: true, alreadySigned: true });
  }

  if (existing.status !== "pending") {
    return NextResponse.json({ error: "Agreement is not in a signable state." }, { status: 409 });
  }

  let signature: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.signature === "string" && body.signature.length > 0) {
      signature = body.signature;
    }
  } catch {
    // no JSON body
  }

  const { data: updatedRows, error: statusError } = await supabase
    .from("agreements")
    .update({ status: "signed" })
    .eq("id", agreementId)
    .eq("status", "pending")
    .select("id,status");

  if (statusError) {
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }
  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      {
        error:
          "Unable to sign this agreement. The row was not updated (likely RLS policy or missing SUPABASE_SERVICE_ROLE_KEY)."
      },
      { status: 403 }
    );
  }

  if (signature) {
    await supabase.from("agreements").update({ client_signature: signature }).eq("id", agreementId);
  }

  return NextResponse.json({ ok: true });
}

```


---

### `app/api/agreement/[id]/deposit/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { normalizeAgreementRow, type Milestone } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  const { supabase } = client;

  const { data: raw, error: fetchError } = await supabase.from("agreements").select("*").eq("id", agreementId).single();
  if (fetchError || !raw) {
    return NextResponse.json({ error: fetchError?.message ?? "Agreement not found." }, { status: 404 });
  }

  const row = normalizeAgreementRow(raw as Record<string, unknown>);
  if (row.status !== "signed") {
    return NextResponse.json({ error: "Agreement must be signed before depositing funds." }, { status: 400 });
  }

  let milestoneIndex: number | null = null;
  let confirmOutOfOrder = false;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.milestoneIndex === "number" && Number.isInteger(body.milestoneIndex)) {
      milestoneIndex = body.milestoneIndex;
    }
    if (body?.confirmOutOfOrder === true) confirmOutOfOrder = true;
  } catch {
    // empty body → single-payment deposit
  }

  const isMilestones = row.payment_type === "milestones" && (row.milestones?.length ?? 0) > 0;

  if (!isMilestones && row.payment_status !== "pending") {
    return NextResponse.json({ error: "Deposit is only allowed while payment is pending." }, { status: 409 });
  }
  if (isMilestones && row.payment_status !== "pending" && row.payment_status !== "escrow_held") {
    return NextResponse.json({ error: "Invalid payment state for milestone deposit." }, { status: 409 });
  }

  if (isMilestones) {
    if (milestoneIndex === null) {
      return NextResponse.json({ error: "milestoneIndex is required for milestone agreements." }, { status: 400 });
    }
    const current = (row.milestones ?? []) as Milestone[];
    if (milestoneIndex < 0 || milestoneIndex >= current.length) {
      return NextResponse.json({ error: "Invalid milestone index." }, { status: 400 });
    }
    const target = current[milestoneIndex];
    if (!target || target.status !== "pending") {
      return NextResponse.json({ error: "This milestone is not awaiting deposit." }, { status: 409 });
    }
    if (milestoneIndex > 0) {
      const previous = current[milestoneIndex - 1];
      const previousFinished = previous?.status === "released";
      if (!previousFinished && !confirmOutOfOrder) {
        return NextResponse.json(
          { error: "Previous milestone is not released yet.", code: "OUT_OF_ORDER" },
          { status: 409 }
        );
      }
    }
    const nextMilestones = current.map((m, i) => ({
      ...m,
      status:
        i === milestoneIndex
          ? ("escrow_held" as const)
          : m.status === "released"
            ? ("released" as const)
            : m.status === "escrow_held"
              ? ("escrow_held" as const)
              : ("pending" as const)
    }));

    const { data: updatedRows, error: updateError } = await supabase
      .from("agreements")
      .update({ milestones: nextMilestones, payment_status: "escrow_held" })
      .eq("id", agreementId)
      .eq("status", "signed")
      .in("payment_status", ["pending", "escrow_held"])
      .select("id,payment_status");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { error: "Deposit was not applied. Check service role key and RLS policies." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  // Single total payment (no milestone rows)
  const { data: updatedRows, error: updateError } = await supabase
    .from("agreements")
    .update({ payment_status: "escrow_held" })
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "pending")
    .select("id,payment_status");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      { error: "Deposit was not applied. Check service role key and RLS policies." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}

```


---

### `app/api/agreement/[id]/release/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeAgreementRow, type Milestone } from "@/lib/agreements/row";
import { getAgreementServerClient } from "@/lib/supabase/agreement-server";

async function updateReleaseStatusWithCompatibility(
  supabase: SupabaseClient,
  agreementId: string,
  payload: Record<string, unknown>
) {
  const tryReleased = await supabase
    .from("agreements")
    .update(payload)
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "escrow_held")
    .select("id,payment_status,status");

  if (!tryReleased.error) return tryReleased;
  const msg = tryReleased.error.message?.toLowerCase() ?? "";
  if (!(msg.includes("check_payment_status") || msg.includes("payment_status"))) return tryReleased;

  // Legacy DBs use `paid` instead of `released`.
  const fallbackPayload = { ...payload, payment_status: "paid" };
  return supabase
    .from("agreements")
    .update(fallbackPayload)
    .eq("id", agreementId)
    .eq("status", "signed")
    .eq("payment_status", "escrow_held")
    .select("id,payment_status,status");
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agreementId = params.id;
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const client = getAgreementServerClient();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  const { supabase } = client;

  const { data: raw, error: fetchError } = await supabase.from("agreements").select("*").eq("id", agreementId).single();
  if (fetchError || !raw) {
    return NextResponse.json({ error: fetchError?.message ?? "Agreement not found." }, { status: 404 });
  }

  const row = normalizeAgreementRow(raw as Record<string, unknown>);
  if (row.status !== "signed") {
    return NextResponse.json({ error: "Funds can only be released from a signed agreement." }, { status: 400 });
  }
  if (row.payment_status !== "escrow_held") {
    return NextResponse.json({ error: "Funds are not held in escrow for release." }, { status: 409 });
  }

  let milestoneIndex: number | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.milestoneIndex === "number" && Number.isInteger(body.milestoneIndex)) {
      milestoneIndex = body.milestoneIndex;
    }
  } catch {
    // single-payment release: no body
  }

  const isMilestones = row.payment_type === "milestones" && (row.milestones?.length ?? 0) > 0;

  if (isMilestones) {
    if (milestoneIndex === null) {
      return NextResponse.json({ error: "milestoneIndex is required for milestone agreements." }, { status: 400 });
    }
    const current = (row.milestones ?? []) as Milestone[];
    if (milestoneIndex < 0 || milestoneIndex >= current.length) {
      return NextResponse.json({ error: "Invalid milestone index." }, { status: 400 });
    }
    const target = current[milestoneIndex];
    if (!target || target.status !== "escrow_held") {
      return NextResponse.json({ error: "This milestone is not in escrow for release." }, { status: 409 });
    }

    const nextMilestones = current.map((m, i) => (i === milestoneIndex ? { ...m, status: "released" as const } : m));
    const allReleased = nextMilestones.every((m) => m.status === "released");
    const updatePayload = {
      milestones: nextMilestones,
      payment_status: allReleased ? ("released" as const) : ("escrow_held" as const),
      status: allReleased ? ("completed" as const) : ("signed" as const)
    };

    const { data: updatedRows, error: updateError } = await updateReleaseStatusWithCompatibility(
      supabase,
      agreementId,
      updatePayload
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { error: "Release was not applied. Check service role key and RLS policies." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (milestoneIndex !== null) {
    return NextResponse.json({ error: "milestoneIndex must not be sent for single-payment agreements." }, { status: 400 });
  }

  const { data: updatedRows, error: updateError } = await updateReleaseStatusWithCompatibility(
    supabase,
    agreementId,
    { payment_status: "released", status: "completed" }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updatedRows?.length) {
    return NextResponse.json(
      { error: "Release was not applied. Check service role key and RLS policies." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}

```


---

### `lib/agreements/row.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentType = "single" | "milestones";
export type Milestone = { title: string; amount: number; status?: "pending" | "escrow_held" | "released" };
export type AgreementStatus = "pending" | "signed" | "completed";

export type NormalizedAgreement = {
  id: string;
  provider_id: string;
  provider_name: string;
  client_name: string;
  project_title: string;
  service_area: string;
  custom_terms: string;
  total_price: number;
  payment_type: PaymentType;
  milestones: Milestone[] | null;
  status: AgreementStatus;
  payment_status: "pending" | "escrow_held" | "released";
  created_at: string;
};

function parseLegacyPaymentTerms(raw: unknown): { payment_type: PaymentType; milestones: Milestone[] | null } {
  if (typeof raw !== "string" || !raw.trim()) return { payment_type: "single", milestones: null };
  const t = raw.trim();
  if (t.toLowerCase() === "single") return { payment_type: "single", milestones: null };
  if (!t.startsWith("{")) return { payment_type: "single", milestones: null };
  try {
    const parsed = JSON.parse(t) as {
      vstahVersion?: number;
      payment_type?: string;
      type?: string;
      milestones?: Milestone[];
    };
    if (parsed.payment_type === "milestones" || parsed.type === "milestones") {
      return {
        payment_type: "milestones",
        milestones: Array.isArray(parsed.milestones)
          ? (parsed.milestones as Milestone[]).map((m) => ({
              title: String(m?.title ?? ""),
              amount: Number(m?.amount ?? 0),
              status: m?.status === "released" ? "released" : m?.status === "escrow_held" ? "escrow_held" : "pending"
            }))
          : []
      };
    }
  } catch {
    // ignore
  }
  return { payment_type: "single", milestones: null };
}

/** Map DB row (modern or legacy column names) to the shape the UI expects. */
export function normalizeAgreementRow(row: Record<string, unknown>): NormalizedAgreement {
  const project_title =
    String(row.project_title ?? row.service_description ?? "").trim() || "";

  let payment_type: PaymentType = "single";
  let milestones: Milestone[] | null = null;

  if (row.payment_type === "milestones" || row.payment_type === "single") {
    payment_type = row.payment_type;
    if (payment_type === "milestones") {
      milestones = Array.isArray(row.milestones)
        ? (row.milestones as Milestone[]).map((m) => ({
            title: String(m?.title ?? ""),
            amount: Number(m?.amount ?? 0),
            status: m?.status === "released" ? "released" : m?.status === "escrow_held" ? "escrow_held" : "pending"
          }))
        : [];
    }
  } else {
    const legacy = parseLegacyPaymentTerms(row.payment_terms);
    payment_type = legacy.payment_type;
    milestones = legacy.milestones;
  }

  return {
    id: String(row.id ?? ""),
    provider_id: String(row.provider_id ?? ""),
    provider_name: String(row.provider_name ?? "").trim(),
    client_name: String(row.client_name ?? ""),
    project_title,
    service_area: String(row.service_area ?? "").trim(),
    custom_terms: String(row.custom_terms ?? "").trim(),
    total_price: Number(row.total_price ?? 0),
    payment_type,
    milestones,
    status: (["pending", "signed", "completed"].includes(String(row.status))
      ? row.status
      : "pending") as AgreementStatus,
    payment_status:
      (String(row.payment_status) === "released" || String(row.payment_status) === "paid")
        ? "released"
        : String(row.payment_status) === "escrow_held"
          ? "escrow_held"
          : "pending",
    created_at: String(row.created_at ?? "")
  };
}

export function isMissingColumnOrSchemaCacheError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    (m.includes("column") && (m.includes("does not exist") || m.includes("schema cache"))) ||
    (m.includes("could not find") && m.includes("column"))
  );
}

/**
 * Inserts using the modern column set first; if the DB is an older agreements table
 * (no project_title / payment_type / milestones), falls back to legacy columns.
 */
export async function insertAgreementWithSchemaFallback(
  supabase: SupabaseClient,
  params: {
    providerId: string;
    clientName: string;
    projectTitle: string;
    serviceArea: string;
    providerName: string;
    customTerms: string;
    totalPrice: number;
    paymentType: PaymentType;
    milestones: Milestone[];
  }
): Promise<{ id?: string; error?: string }> {
  const modern = {
    provider_id: params.providerId,
    client_name: params.clientName,
    project_title: params.projectTitle,
    service_area: params.serviceArea,
    provider_name: params.providerName,
    custom_terms: params.customTerms,
    total_price: params.totalPrice,
    payment_type: params.paymentType,
    milestones:
      params.paymentType === "milestones"
        ? params.milestones.map((m) => ({
            ...m,
            status: m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
          }))
        : [],
    status: "pending" as const
  };

  const { data: modernData, error: modernError } = await supabase
    .from("agreements")
    .insert(modern)
    .select("id")
    .single();

  if (!modernError && modernData?.id) {
    return { id: modernData.id as string };
  }

  if (!isMissingColumnOrSchemaCacheError(modernError?.message)) {
    return { error: modernError?.message ?? "Failed to create agreement." };
  }

  const legacy = {
    provider_id: params.providerId,
    client_name: params.clientName,
    service_description: params.projectTitle,
    total_price: params.totalPrice,
    payment_terms:
      params.paymentType === "milestones"
        ? JSON.stringify({
            vstahVersion: 1,
            payment_type: "milestones",
            milestones: params.milestones.map((m) => ({
              ...m,
              status: m.status === "released" ? "released" : m.status === "escrow_held" ? "escrow_held" : "pending"
            }))
          })
        : "single",
    status: "pending" as const
  };

  const { data: legacyData, error: legacyError } = await supabase
    .from("agreements")
    .insert(legacy)
    .select("id")
    .single();

  if (!legacyError && legacyData?.id) {
    return { id: legacyData.id as string };
  }

  return {
    error:
      legacyError?.message ??
      modernError?.message ??
      "Failed to create agreement. Run the SQL migration in Supabase to add project_title and milestones."
  };
}

```


---

### `lib/site-url.ts`

```typescript
/**
 * Canonical public origin for agreement links (copy/share).
 * Prefer NEXT_PUBLIC_SITE_URL in production so links stay correct when opened from the dashboard on localhost.
 */
export function getPublicSiteOrigin(): string {
  const fromEnv = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") : "";
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Full absolute URL for sharing (clipboard, WhatsApp). Call from client or set NEXT_PUBLIC_SITE_URL for SSR. */
export function buildAgreementPublicUrl(agreementId: string): string {
  const origin = getPublicSiteOrigin();
  if (origin) return `${origin}/agreement/${agreementId}`;
  if (typeof window !== "undefined") return `${window.location.origin}/agreement/${agreementId}`;
  return `https://vstah.am/agreement/${agreementId}`;
}

```


---

### `lib/supabase/browser-client.ts`

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

/** Returns null when Supabase env vars are missing or client creation fails. */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    cached = null;
    return null;
  }
  try {
    cached = createClient(url, key);
    return cached;
  } catch {
    console.warn("[vstah] Supabase createClient failed — using mock auth.");
    cached = null;
    return null;
  }
}

```


---

### `lib/supabase/agreement-server.ts`

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AgreementServerClient = { supabase: SupabaseClient; hasServiceRole: boolean };

/** Server-only Supabase client for agreement mutations (sign / escrow). */
export function getAgreementServerClient(): AgreementServerClient | { error: string; status: number } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = service ?? anon;
  if (!url || !key) {
    return { error: "Supabase is not configured.", status: 500 };
  }
  return { supabase: createClient(url, key), hasServiceRole: Boolean(service) };
}

```


---

### `lib/auth/auth-context.tsx`

```tsx
"use client";

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { humanizeAuthError } from "./humanize-auth-error";
import { mockGetSession, mockLogin, mockLogout, mockRegister } from "./mock-storage";
import { getSupabaseBrowser } from "@/lib/supabase/browser-client";

export type AuthUser = { id: string; email: string; source: "supabase" | "mock" };
export type SignUpMetadata = {
  full_name_or_business_name: string;
  phone_number: string;
  service_category: "General Contractor" | "Renovations" | "Electricity" | "Cleaning" | "Other";
  service_area: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  resendConfirmation: (email: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    metadata?: SignUpMetadata
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email ?? "",
    source: "supabase"
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseBrowser>;
    try {
      supabase = getSupabaseBrowser();
    } catch {
      supabase = null;
    }

    if (!supabase) {
      setUser(() => {
        const m = mockGetSession();
        return m ? { ...m, source: "mock" as const } : null;
      });
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        setUser(session?.user ? mapSupabaseUser(session.user) : null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: humanizeAuthError(error.message) } : {};
    }
    const res = mockLogin(email, password);
    if (res.error) return { error: res.error };
    if (res.user) setUser({ ...res.user, source: "mock" });
    return {};
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return {};
    const { error } = await supabase.auth.resend({
      type: "signup",
      email
    });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return {};
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? { error: humanizeAuthError(error.message) } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: SignUpMetadata) => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login?email=${encodeURIComponent(email)}` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo
        }
      });
      if (error) return { error: humanizeAuthError(error.message) };
      // If session is missing, attempt immediate password sign-in.
      // This keeps auto-login working when email confirmation is disabled.
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          const humanized = humanizeAuthError(signInError.message);
          if (humanized.toLowerCase().includes("confirm")) {
            return { needsEmailConfirmation: true };
          }
          return { error: humanized };
        }
      }
      return {};
    }
    const reg = mockRegister(email, password);
    if (reg.error) return reg;
    const res = mockLogin(email, password);
    if (res.error) return { error: res.error };
    if (res.user) setUser({ ...res.user, source: "mock" });
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    else mockLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, resendConfirmation, requestPasswordReset, signUp, signOut }),
    [user, loading, signIn, resendConfirmation, requestPasswordReset, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Safe optional hook for components outside provider (should not happen) */
export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext);
}

```


---

### `lib/auth/humanize-auth-error.ts`

```typescript
/** Maps Supabase GoTrue messages to short, actionable copy for the UI. */
export function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return "Your account exists, but email confirmation is still required. Open your email inbox, click the confirmation link, then log in again.";
  }
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password, or your email is not confirmed yet.";
  }
  if (m.includes("email rate limit") || (m.includes("rate limit") && m.includes("email"))) {
    return (
      "Too many confirmation emails were sent recently (Supabase security limit). " +
      "Wait about an hour and try again, or use another Wi‑Fi/mobile data. " +
      "Project owners: Supabase Dashboard → Authentication → Emails — adjust rate limits or SMTP, " +
      "or turn off “Confirm email” while testing."
    );
  }
  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  return message;
}

```


---

### `lib/auth/mock-storage.ts`

```typescript
/**
 * DEV-ONLY mock credential store (localStorage).
 * Replace with Supabase Auth in production.
 */

export type MockUser = { id: string; email: string };

const USERS_KEY = "vstah_mock_users";
const SESSION_KEY = "vstah_mock_session";

type StoredUser = { id: string; email: string; password: string };

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function mockRegister(email: string, password: string): { error?: string } {
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with this email already exists." };
  }
  const id = crypto.randomUUID();
  users.push({ id, email: email.trim().toLowerCase(), password });
  writeUsers(users);
  return {};
}

export function mockLogin(email: string, password: string): { user?: MockUser; error?: string } {
  const users = readUsers();
  const found = users.find(
    (u) => u.email === email.trim().toLowerCase() && u.password === password
  );
  if (!found) return { error: "Invalid email or password." };
  const session: MockUser = { id: found.id, email: found.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: session };
}

export function mockLogout() {
  localStorage.removeItem(SESSION_KEY);
}

export function mockGetSession(): MockUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

```


---

### `lib/i18n/language-context.tsx`

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "hy" | "ru";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const STORAGE_KEY = "vstah-language";

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "en" || raw === "hy" || raw === "ru") {
        setLanguageState(raw);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore localStorage errors
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => setLanguageState(next)
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

```


---

### `lib/brand.ts`

```typescript
/** Armenian flag palette — site-wide */
export const NAVY = "#0033A0";
export const ORANGE = "#F2A800";
export const RED = "#E30A17";

```


---

### `lib/db/types.ts`

```typescript
/**
 * JSON-ready shapes for persistence (Supabase tables, REST API, etc.).
 */

export type CreateDealPayload = {
  kind: "create_deal";
  createdAt: string;
  updatedAt?: string;
  submittedByEmail?: string;
  projectTitle: string;
  description: string;
  totalAmountAMD: number;
  currency: "AMD";
  renovationStages: string;
  clientName: string;
  clientEmail: string;
  contractorEmail?: string;
  notes?: string;
};

export type ProtectProjectPayload = {
  kind: "protect_project";
  createdAt: string;
  submittedByEmail?: string;
  homeownerEmail: string;
  homeownerName?: string;
  contractorInviteEmail: string;
  projectSummary: string;
  invitationMessage?: string;
};

```


---

### `lib/db/prepare-payload.ts`

```typescript
import type { CreateDealPayload, ProtectProjectPayload } from "./types";

export function prepareCreateDealPayload(input: {
  projectTitle: string;
  description: string;
  totalAmountAMD: number;
  renovationStages: string;
  clientName: string;
  clientEmail: string;
  contractorEmail?: string;
  notes?: string;
  submittedByEmail?: string;
}): CreateDealPayload {
  const now = new Date().toISOString();
  return {
    kind: "create_deal",
    createdAt: now,
    updatedAt: now,
    currency: "AMD",
    submittedByEmail: input.submittedByEmail,
    projectTitle: input.projectTitle.trim(),
    description: input.description.trim(),
    totalAmountAMD: Math.round(Number(input.totalAmountAMD)),
    renovationStages: input.renovationStages.trim(),
    clientName: input.clientName.trim(),
    clientEmail: input.clientEmail.trim().toLowerCase(),
    contractorEmail: input.contractorEmail?.trim().toLowerCase() || undefined,
    notes: input.notes?.trim() || undefined
  };
}

export function prepareProtectProjectPayload(input: {
  homeownerEmail: string;
  homeownerName?: string;
  contractorInviteEmail: string;
  projectSummary: string;
  invitationMessage?: string;
  submittedByEmail?: string;
}): ProtectProjectPayload {
  return {
    kind: "protect_project",
    createdAt: new Date().toISOString(),
    submittedByEmail: input.submittedByEmail,
    homeownerEmail: input.homeownerEmail.trim().toLowerCase(),
    homeownerName: input.homeownerName?.trim() || undefined,
    contractorInviteEmail: input.contractorInviteEmail.trim().toLowerCase(),
    projectSummary: input.projectSummary.trim(),
    invitationMessage: input.invitationMessage?.trim() || undefined
  };
}

```


---

### `lib/demo-queue.ts`

```typescript
/**
 * Dev/demo: append prepared payloads locally until a real API exists.
 */

const KEY = "vstah_pending_db_writes";

export function enqueueDbPayload(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown[]) : [];
    arr.push(payload);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {
    console.warn("enqueueDbPayload failed");
  }
}

```


---

### `components/vstah-shell.tsx`

```tsx
"use client";

import Link from "next/link";
import { NAVY } from "@/lib/brand";
import { useAuthOptional } from "@/lib/auth/auth-context";
import { OrangeButton } from "@/components/vstah-button";
import { useLanguage } from "@/lib/i18n/language-context";

export function VstahShell({
  children,
  eyebrow,
  title,
  subtitle,
  maxWidthClass = "max-w-xl"
}: {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
}) {
  const auth = useAuthOptional();
  const { language } = useLanguage();
  const tx =
    language === "hy"
      ? { signOut: "Դուրս գալ", login: "Մուտք", register: "Գրանցվել" }
      : language === "ru"
        ? { signOut: "Выйти", login: "Войти", register: "Регистрация" }
        : { signOut: "Sign out", login: "Login", register: "Register" };

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: NAVY }}>
      <header
        className="sticky top-0 z-40 border-b border-black/10 bg-white shadow-lg shadow-black/10"
      >
        <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between gap-3 px-4 md:h-[84px] md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-slate-900">
            <img src="/logo-vstah-clean.png" alt="VSTAH logo" className="h-10 w-10 md:h-11 md:w-11" />
            <span className="text-lg font-bold tracking-tight md:text-xl">VSTAH.am</span>
          </Link>

          <div className="flex items-center justify-end gap-2 md:gap-3">
            {auth?.loading ? (
              <span className="inline-flex h-8 min-w-[70px] items-center justify-center text-xs text-slate-500">…</span>
            ) : auth?.user ? (
              <>
                <span className="hidden truncate text-sm text-slate-700 sm:inline max-w-[12rem]" title={auth.user.email}>
                  {auth.user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void auth.signOut()}
                  className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
                >
                  {tx.signOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:text-sm"
                >
                  {tx.login}
                </Link>
                <OrangeButton href="/register" className="px-4 py-2 text-xs sm:text-sm">
                  {tx.register}
                </OrangeButton>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-10 md:px-6">
        <div className={`mx-auto w-full ${maxWidthClass}`}>
          {eyebrow ? (
            <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-white/70">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
          {subtitle ? <p className="mx-auto mt-3 max-w-lg text-center text-base text-white/85">{subtitle}</p> : null}

          <div className="mt-10 rounded-3xl border border-white/15 bg-white p-6 shadow-2xl shadow-black/20 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

```


---

### `components/vstah-button.tsx`

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { NAVY, ORANGE } from "@/lib/brand";

export function OrangeButton({
  children,
  className = "",
  href = "#"
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-center text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-95 active:brightness-90 sm:text-base ${className}`}
      style={{ backgroundColor: ORANGE, boxShadow: `0 10px 30px -8px ${ORANGE}88` }}
    >
      {children}
    </Link>
  );
}

/** Outline on navy / hero backgrounds */
export function OutlineLightButton({
  children,
  href = "/#difference",
  className = ""
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/70 hover:bg-white/10 sm:text-base ${className}`}
    >
      {children}
    </Link>
  );
}

/** Secondary outline on white cards */
export function OutlineDarkButton({
  children,
  href,
  className = ""
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl border-2 px-6 py-3 text-center text-sm font-semibold transition hover:bg-slate-50 sm:text-base ${className}`}
      style={{ borderColor: NAVY, color: NAVY }}
    >
      {children}
    </Link>
  );
}

```


---

### `supabase/migrations/20260425_create_agreements.sql`

```sql
create extension if not exists pgcrypto;

create table if not exists public.agreements (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  project_title text not null,
  total_price numeric not null check (total_price > 0),
  payment_type text not null default 'single' check (payment_type in ('single', 'milestones')),
  milestones jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'signed', 'completed')),
  client_signature text,
  created_at timestamptz not null default now()
);

create index if not exists agreements_provider_id_idx on public.agreements(provider_id);
create index if not exists agreements_status_idx on public.agreements(status);

alter table public.agreements add column if not exists project_title text;
alter table public.agreements add column if not exists payment_type text not null default 'single';
alter table public.agreements add column if not exists milestones jsonb not null default '[]'::jsonb;

alter table public.agreements drop column if exists provider_name;
alter table public.agreements drop column if exists service_description;
alter table public.agreements drop column if exists payment_terms;

update public.agreements
set payment_type = 'single'
where payment_type is null or payment_type not in ('single', 'milestones');

alter table public.agreements
  drop constraint if exists agreements_payment_type_check,
  add constraint agreements_payment_type_check check (payment_type in ('single', 'milestones'));

alter table public.agreements
  drop constraint if exists agreements_status_check,
  add constraint agreements_status_check check (status in ('pending', 'signed', 'completed'));

```


---

### `supabase/migrations/20260425_agreements_contract_terms_and_payment_status.sql`

```sql
-- Agreement flow upgrade:
-- - custom_terms column for provider-authored terms
-- - payment_status column for escrow release flow
-- - provider_name + service_area for document rendering

alter table public.agreements add column if not exists custom_terms text;
alter table public.agreements add column if not exists payment_status text not null default 'pending';
alter table public.agreements add column if not exists provider_name text;
alter table public.agreements add column if not exists service_area text;

update public.agreements
set payment_status = 'pending'
where payment_status is null or payment_status not in ('pending', 'released');

alter table public.agreements
  drop constraint if exists agreements_payment_status_check,
  add constraint agreements_payment_status_check check (payment_status in ('pending', 'released'));

notify pgrst, 'reload schema';

```


---

### `supabase/migrations/20260425_agreements_payment_status_escrow_held.sql`

```sql
-- Add escrow stage to payment_status lifecycle:
-- pending -> escrow_held -> released

update public.agreements
set payment_status = 'pending'
where payment_status is null or payment_status not in ('pending', 'escrow_held', 'released');

alter table public.agreements
  drop constraint if exists agreements_payment_status_check,
  add constraint agreements_payment_status_check check (payment_status in ('pending', 'escrow_held', 'released'));

notify pgrst, 'reload schema';

```


---

### `supabase/migrations/20260425_agreements_public_sign_policy.sql`

```sql
-- Temporary policy to allow public client-link signing/deposit/release flows.
-- Use for testing/demo environments. Tighten policies for production.

alter table public.agreements enable row level security;

drop policy if exists agreements_public_read on public.agreements;
create policy agreements_public_read
on public.agreements
for select
using (true);

drop policy if exists agreements_public_update on public.agreements;
create policy agreements_public_update
on public.agreements
for update
using (true)
with check (true);

notify pgrst, 'reload schema';

```


---

### `supabase/migrations/20260426_agreements_fix_missing_columns.sql`

```sql
-- Fix older public.agreements tables missing project_title / payment_type / milestones.
-- Run in Supabase SQL Editor if you see: "column agreements.project_title does not exist"

alter table public.agreements add column if not exists project_title text;
alter table public.agreements add column if not exists payment_type text;
alter table public.agreements add column if not exists milestones jsonb;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'agreements'
      and column_name = 'service_description'
  ) then
    update public.agreements
    set project_title = coalesce(
      nullif(trim(project_title), ''),
      nullif(trim(service_description), ''),
      'Untitled project'
    )
    where project_title is null or trim(coalesce(project_title, '')) = '';
  else
    update public.agreements
    set project_title = coalesce(nullif(trim(project_title), ''), 'Untitled project')
    where project_title is null or trim(coalesce(project_title, '')) = '';
  end if;
end $$;

alter table public.agreements drop column if exists provider_name;
alter table public.agreements drop column if exists service_description;
alter table public.agreements drop column if exists payment_terms;

update public.agreements
set payment_type = 'single'
where payment_type is null or payment_type not in ('single', 'milestones');

update public.agreements
set milestones = '[]'::jsonb
where milestones is null;

alter table public.agreements
  alter column payment_type set default 'single';

alter table public.agreements
  alter column milestones set default '[]'::jsonb;

alter table public.agreements alter column project_title set not null;
alter table public.agreements alter column payment_type set not null;
alter table public.agreements alter column milestones set not null;

alter table public.agreements
  drop constraint if exists agreements_payment_type_check,
  add constraint agreements_payment_type_check check (payment_type in ('single', 'milestones'));

alter table public.agreements
  drop constraint if exists agreements_status_check,
  add constraint agreements_status_check check (status in ('pending', 'signed', 'completed'));

notify pgrst, 'reload schema';

```


---

### `supabase/migrations/20260427_agreements_add_milestones.sql`

```sql
-- Fix: "Could not find the 'milestones' column of 'agreements' in the schema cache"
-- Run this entire script in Supabase → SQL → New query → Run

-- 1) Ensure column exists (safe if already present)
alter table public.agreements add column if not exists milestones jsonb;

-- 2) Backfill nulls (older rows)
update public.agreements
set milestones = '[]'::jsonb
where milestones is null;

-- 3) Default + NOT NULL (matches app: always jsonb array)
alter table public.agreements
  alter column milestones set default '[]'::jsonb;

alter table public.agreements
  alter column milestones set not null;

-- 4) Reload PostgREST schema cache (required after DDL)
notify pgrst, 'reload schema';

```
