import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  phone_number: string | null;
  service_category: string | null;
  service_area: string | null;
  created_at: string;
  agreement_count: number;
};

export async function GET(request: NextRequest) {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;

  const client = getAdminSupabase();
  if ("error" in client) {
    return NextResponse.json({ total: 0, filtered: 0, users: [], error: client.error }, { status: 200 });
  }
  const { supabase } = client;

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id,email,full_name,business_name,phone_number,service_category,service_area,created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    const soft =
      error.message.toLowerCase().includes("fetch failed") ||
      error.message.toLowerCase().includes("failed to fetch")
        ? "Supabase is unreachable from this server. Local mock users may still appear below."
        : error.message;
    return NextResponse.json({ total: 0, filtered: 0, users: [], error: soft }, { status: 200 });
  }

  const rows = (profiles ?? []) as Omit<AdminUserRow, "agreement_count">[];

  const { data: agreements } = await supabase.from("agreements").select("provider_id");
  const counts: Record<string, number> = {};
  for (const row of agreements ?? []) {
    const pid = String((row as { provider_id?: string }).provider_id ?? "");
    if (!pid) continue;
    counts[pid] = (counts[pid] ?? 0) + 1;
  }

  let users: AdminUserRow[] = rows.map((p) => ({
    ...p,
    full_name: p.full_name ?? "",
    business_name: p.business_name ?? "",
    agreement_count: counts[p.id] ?? 0
  }));

  if (q) {
    users = users.filter((u) => {
      const haystack = [
        u.email,
        u.full_name,
        u.business_name,
        u.phone_number,
        u.service_category,
        u.service_area
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return NextResponse.json({
    total: rows.length,
    filtered: users.length,
    users
  });
}
