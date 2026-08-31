import { fetchAgreementById } from "@/lib/agreements/load-server";
import AgreementClientPage from "./agreement-client-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: { id: string };
};

/** Preload agreement on the server so shared links render content immediately. */
export default async function AgreementPage({ params }: PageProps) {
  const id = params?.id?.trim() ?? "";
  const initialAgreement = id ? await fetchAgreementById(id) : null;

  return <AgreementClientPage agreementId={id} initialAgreement={initialAgreement} />;
}
