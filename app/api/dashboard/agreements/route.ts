import { NextRequest, NextResponse } from "next/server";
import { normalizeAgreementRow } from "@/lib/agreements/row";
import {
  getAgreementMutationClient,
  getAgreementServerClient,
  readBearerToken
} from "@/lib/supabase/agreement-server";

/** List agreements for the signed-in provider (server read — reliable for dashboard Overview). */
export async function GET(request: NextRequest) {
  const server = getAgreementServerClient();
  if ("error" in server) {
    return NextResponse.json({ error: server.error }, { status: server.status });
  }

  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError
  } = await server.supabase.auth.getUser(token);

  if (authError || !user?.id) {
    return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
  }

  const db = getAgreementMutationClient(server, token);
  if ("error" in db) {
    return NextResponse.json({ error: db.error }, { status: 500 });
  }

  const { data, error } = await db
    .from("agreements")
    .select("*")
    .eq("provider_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    agreements: (data ?? []).map((row) => normalizeAgreementRow(row as Record<string, unknown>))
  });
}
