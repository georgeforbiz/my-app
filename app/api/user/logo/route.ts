import { NextRequest, NextResponse } from "next/server";
import {
  getAgreementServerClient,
  getSupabaseClientForAccessToken,
  readBearerToken
} from "@/lib/supabase/agreement-server";
import { deleteProviderLogosFromStorage, uploadProviderLogoToStorage } from "@/lib/supabase/logo-storage";

async function resolveUserId(request: NextRequest): Promise<{ userId?: string; error?: string; status?: number }> {
  const server = getAgreementServerClient();
  if ("error" in server) {
    return { error: server.error, status: server.status };
  }

  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) {
    return { error: "Authentication required.", status: 401 };
  }

  const {
    data: { user },
    error: authError
  } = await server.supabase.auth.getUser(token);

  if (authError || !user?.id) {
    return { error: "Invalid or expired session.", status: 401 };
  }

  return { userId: user.id };
}

/** Upload provider logo to `logos/{userId}/logo-{timestamp}.ext`. */
export async function POST(request: NextRequest) {
  const auth = await resolveUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
  }

  const db = getSupabaseClientForAccessToken(readBearerToken(request.headers.get("authorization"))!);
  if ("error" in db) {
    return NextResponse.json({ error: db.error }, { status: 500 });
  }

  const uploaded = await uploadProviderLogoToStorage(db, auth.userId, file);
  if (!uploaded.url) {
    return NextResponse.json({ error: uploaded.error ?? "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ url: uploaded.url, path: uploaded.path });
}

/** Delete all logos under `logos/{userId}/`. */
export async function DELETE(request: NextRequest) {
  const auth = await resolveUserId(request);
  if (!auth.userId) {
    return NextResponse.json({ error: auth.error }, { status: auth.status ?? 401 });
  }

  const db = getSupabaseClientForAccessToken(readBearerToken(request.headers.get("authorization"))!);
  if ("error" in db) {
    return NextResponse.json({ error: db.error }, { status: 500 });
  }

  await deleteProviderLogosFromStorage(db, auth.userId);
  return NextResponse.json({ ok: true });
}
