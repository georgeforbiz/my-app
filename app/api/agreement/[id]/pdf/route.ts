import { NextResponse } from "next/server";
import { fetchAgreementById } from "@/lib/agreements/load-server";
import { buildSignedAgreementPdfBytes } from "@/lib/agreements/signed-pdf-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Download a generated (or archived) agreement PDF. Uses service role — no login required for share-link access. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const agreementId = params.id?.trim();
  if (!agreementId) {
    return NextResponse.json({ error: "Agreement id is required." }, { status: 400 });
  }

  const agreement = await fetchAgreementById(agreementId);
  if (!agreement) {
    return NextResponse.json({ error: "Agreement not found." }, { status: 404 });
  }

  const filename = `agreement-${agreementId.slice(0, 8)}.pdf`;

  // Always generate with the current layout builder so download reflects
  // layout upgrades. Storage `pdf_url` remains the signed archive snapshot.
  try {
    const bytes = await buildSignedAgreementPdfBytes(agreement);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Could not generate agreement PDF."
      },
      { status: 500 }
    );
  }
}
