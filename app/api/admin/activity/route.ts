import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminSupabase } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = requireAdmin();
  if (!auth.ok) return auth.response;

  const client = getAdminSupabase();
  if ("error" in client) {
    return NextResponse.json({ error: client.error }, { status: client.status });
  }
  const { supabase } = client;

  const { data: events, error } = await supabase
    .from("activity_events")
    .select("id,created_at,actor_type,actor_id,action,agreement_id,meta")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    if (
      error.message.toLowerCase().includes("activity_events") ||
      error.message.toLowerCase().includes("schema cache")
    ) {
      const derived = await buildDerivedHistory(supabase);
      return NextResponse.json({
        events: [],
        derived,
        warning: "activity_events table missing — run the SQL migration to enable the live feed."
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const derived = await buildDerivedHistory(supabase);
  return NextResponse.json({ events: events ?? [], derived });
}

async function buildDerivedHistory(supabase: SupabaseClient) {
  const [{ data: profiles }, { data: agreements }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name,business_name,created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("agreements")
      .select("id,client_name,project_title,status,payment_status,created_at,total_price")
      .order("created_at", { ascending: false })
      .limit(25)
  ]);

  return {
    recentUsers: profiles ?? [],
    recentAgreements: agreements ?? []
  };
}
