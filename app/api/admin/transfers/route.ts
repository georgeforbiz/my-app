import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { withAdminTimeout } from "@/lib/admin/with-timeout";

export const dynamic = "force-dynamic";

type AgreementSummary = {
  id: string;
  client_name?: string;
  project_title?: string;
  total_price?: number;
  business_name?: string;
  full_name?: string;
};

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;

  const client = getAdminSupabase();
  if ("error" in client) {
    return NextResponse.json({ transfers: [], error: client.error }, { status: 200 });
  }

  try {
    const [verificationResult, agreementResult] = await withAdminTimeout(
      Promise.all([
        client.supabase
          .from("deposit_verifications")
          .select("agreement_id,milestone_index,submitted_at")
          .eq("status", "submitted")
          .order("submitted_at", { ascending: false })
          .limit(100),
        client.supabase
          .from("agreements")
          .select("id,client_name,project_title,total_price,business_name,full_name")
      ])
    );

    if (verificationResult.error) {
      const message = verificationResult.error.message;
      const migrationMissing =
        message.toLowerCase().includes("deposit_verifications") ||
        message.toLowerCase().includes("schema cache");
      return NextResponse.json({
        transfers: [],
        error: migrationMissing
          ? "Transfer tracking is not active in Supabase. Run the admin SQL migration."
          : message
      });
    }

    if (agreementResult.error) {
      return NextResponse.json({ transfers: [], error: agreementResult.error.message });
    }

    const agreements = new Map(
      ((agreementResult.data ?? []) as AgreementSummary[]).map((agreement) => [agreement.id, agreement])
    );
    const transfers = (verificationResult.data ?? []).flatMap((verification) => {
      const agreement = agreements.get(String(verification.agreement_id));
      if (!agreement) return [];
      return [
        {
          agreement_id: String(verification.agreement_id),
          milestone_index: Number(verification.milestone_index),
          submitted_at: String(verification.submitted_at ?? ""),
          client_name: String(agreement.client_name ?? ""),
          project_title: String(agreement.project_title ?? ""),
          provider_label: String(
            agreement.business_name ?? agreement.full_name ?? ""
          ),
          total_price: Number(agreement.total_price ?? 0)
        }
      ];
    });

    return NextResponse.json({ transfers });
  } catch {
    return NextResponse.json({
      transfers: [],
      error: "Supabase is unavailable right now. Transfer loading was stopped instead of delaying the panel."
    });
  }
}
