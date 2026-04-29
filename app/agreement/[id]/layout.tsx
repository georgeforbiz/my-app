/**
 * Avoid stale HTML caching for agreement views so DB updates show on refresh.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AgreementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
