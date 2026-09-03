import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { withAdminTimeout } from "@/lib/admin/with-timeout";

export const dynamic = "force-dynamic";

const EMPTY = {
  users: 0,
  agreements: 0,
  signed: 0,
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

  try {
    [usersRes, agreementsRes] = await withAdminTimeout(
      Promise.all([
        supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        supabase.from("agreements").select("id,status")
      ])
    );
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

  const list = (agreementsRes.error ? [] : agreementsRes.data ?? []) as Array<{ status?: string }>;
  const userCount = usersRes.error ? 0 : usersRes.data.total ?? usersRes.data.users.length;
  const signed = list.filter((a) => a.status === "signed" || a.status === "completed").length;

  const warnings = [usersRes.error?.message, agreementsRes.error?.message]
    .map((m) => humanizeFetchError(m))
    .filter(Boolean);
  const uniqueWarnings = [...new Set(warnings)];
  const cloudUnreachable = uniqueWarnings.some((w) => w?.includes("unreachable"));

  return NextResponse.json({
    users: userCount,
    agreements: list.length,
    signed,
    source:
      cloudUnreachable || (userCount === 0 && list.length === 0 && uniqueWarnings.length > 0)
        ? "empty"
        : "supabase",
    ...(uniqueWarnings.length ? { warning: uniqueWarnings[0] } : {})
  });
}
