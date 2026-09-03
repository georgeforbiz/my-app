import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { withAdminTimeout } from "@/lib/admin/with-timeout";

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

  const [authResult, profileResult] = await Promise.all([
    withAdminTimeout(supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }))
      .then((result) => ({ result, message: "" }))
      .catch((error: unknown) => ({
        result: null,
        message: error instanceof Error ? error.message : "Could not load auth users."
      })),
    withAdminTimeout(
      supabase
        .from("profiles")
        .select("id,email,full_name,business_name,phone_number,service_category,service_area,created_at")
        .order("created_at", { ascending: false })
    )
      .then((result) => ({ result, message: "" }))
      .catch((error: unknown) => ({
        result: null,
        message: error instanceof Error ? error.message : "Could not load profiles."
      }))
  ]);

  const profileError = profileResult.result?.error?.message ?? profileResult.message;
  const authError = authResult.result?.error?.message ?? authResult.message;

  const profiles = (profileResult.result?.data ?? []) as Omit<AdminUserRow, "agreement_count">[];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const authUsers = authResult.result?.data.users ?? [];

  // Auth is the source of truth. Profiles only enrich contact/business fields.
  // Fall back to profiles for projects where auth.admin.listUsers is unavailable.
  let users: AdminUserRow[] =
    authUsers.length > 0
      ? authUsers.map((authUser) => {
          const profile = profilesById.get(authUser.id);
          const metadata = authUser.user_metadata as Record<string, unknown> | undefined;
          return {
            id: authUser.id,
            email: authUser.email ?? profile?.email ?? "",
            full_name: profile?.full_name ?? String(metadata?.full_name ?? ""),
            business_name: profile?.business_name ?? String(metadata?.business_name ?? ""),
            phone_number: profile?.phone_number ?? (metadata?.phone_number ? String(metadata.phone_number) : null),
            service_category:
              profile?.service_category ?? (metadata?.service_category ? String(metadata.service_category) : null),
            service_area: profile?.service_area ?? (metadata?.service_area ? String(metadata.service_area) : null),
            created_at: authUser.created_at ?? profile?.created_at ?? "",
            agreement_count: 0
          };
        })
      : profiles.map((profile) => ({
          ...profile,
          full_name: profile.full_name ?? "",
          business_name: profile.business_name ?? "",
          agreement_count: 0
        }));
  const total = users.length;

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
    total,
    filtered: users.length,
    users,
    ...((authError || profileError) && users.length === 0
      ? {
          error:
            "Supabase is unavailable right now. The admin page stopped waiting and is showing local browser accounts."
        }
      : {})
  });
}
