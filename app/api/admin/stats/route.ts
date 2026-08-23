import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { withAdminTimeout } from "@/lib/admin/with-timeout";

export const dynamic = "force-dynamic";

const EMPTY = {
  users: 0,
  agreements: 0,
  pending: 0,
  signed: 0,
  fundsSecured: 0,
  completed: 0,
  pendingVerification: 0,
  pendingTransfers: [] as Array<{
    agreement_id: string;
    milestone_index: number;
    submitted_at: string;
    client_name: string;
    project_title: string;
    total_price: number;
  }>,
  source: "empty" as "supabase" | "empty"
};

function humanizeFetchError(message: string | undefined): string | null {
  if (!message) return null;
  const m = message.toLowerCase();
  if (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("network") ||
    m.includes("econnrefused") ||
    m.includes("enotfound") ||
    m.includes("timed out") ||
    m.includes("timeout")
  ) {
    return "Supabase is unreachable from this server. Showing local browser data when available.";
  }
  if (m.includes("deposit_verifications") || m.includes("schema cache")) {
    return "Run the admin SQL migration in Supabase to enable transfer verification tracking.";
  }
  return message;
}

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;

  const client = getAdminSupabase();
  if ("error" in client) {
    return NextResponse.json(
      {
        ...EMPTY,
        warning: humanizeFetchError(client.error) ?? client.error,
        source: "empty"
      },
      { status: 200 }
    );
  }
  const { supabase } = client;

  let usersRes: {
    data: { users: unknown[]; total?: number };
    error: { message: string } | null;
  };
  let agreementsRes: { data: unknown[] | null; error: { message: string } | null };
  let pendingRes: { data: unknown[] | null; error: { message: string } | null };

  try {
    [usersRes, agreementsRes, pendingRes] = await withAdminTimeout(Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabase
        .from("agreements")
        .select("id,status,payment_status,created_at,client_name,project_title,total_price"),
      supabase
        .from("deposit_verifications")
        .select("id,agreement_id,milestone_index,submitted_at")
        .eq("status", "submitted")
    ]));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return NextResponse.json(
      {
        ...EMPTY,
        warning: humanizeFetchError(msg) ?? msg,
        source: "empty"
      },
      { status: 200 }
    );
  }

  const list = (agreementsRes.error ? [] : agreementsRes.data ?? []) as Array<{
    id: string;
    status?: string;
    payment_status?: string;
    client_name?: string;
    project_title?: string;
    total_price?: number;
  }>;
  const userCount = usersRes.error ? 0 : usersRes.data.total ?? usersRes.data.users.length;
  const pendingDeps = (pendingRes.error ? [] : pendingRes.data ?? []) as Array<{
    agreement_id: string;
    milestone_index: number;
    submitted_at: string;
  }>;

  const fundsSecured = list.filter((a) => a.payment_status === "escrow_held").length;
  const completed = list.filter(
    (a) => a.status === "completed" || a.payment_status === "released" || a.payment_status === "paid"
  ).length;
  const signed = list.filter((a) => a.status === "signed").length;
  const pending = list.filter((a) => a.status === "pending").length;

  const pendingTransfers = pendingDeps
    .map((d) => {
      const agr = list.find((a) => a.id === d.agreement_id);
      if (!agr) return null;
      return {
        agreement_id: d.agreement_id,
        milestone_index: d.milestone_index,
        submitted_at: d.submitted_at,
        client_name: String(agr.client_name ?? ""),
        project_title: String(agr.project_title ?? ""),
        total_price: Number(agr.total_price ?? 0)
      };
    })
    .filter(Boolean)
    .slice(0, 100);

  const rawWarnings = [usersRes.error?.message, agreementsRes.error?.message, pendingRes.error?.message]
    .map((m) => humanizeFetchError(m))
    .filter(Boolean);
  // Deduplicate soft messages
  const warnings = [...new Set(rawWarnings)];

  const cloudUnreachable = warnings.some((w) => w?.includes("unreachable"));

  return NextResponse.json({
    users: userCount,
    agreements: list.length,
    pending,
    signed,
    fundsSecured,
    completed,
    pendingVerification: pendingDeps.length,
    pendingTransfers,
    source: cloudUnreachable || (userCount === 0 && list.length === 0 && warnings.length > 0) ? "empty" : "supabase",
    ...(warnings.length ? { warning: warnings[0] } : {})
  });
}
