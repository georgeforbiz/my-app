import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/lib/admin/supabase";
import { isMissingColumnOrSchemaCacheError } from "@/lib/agreements/row";

export type ActivityAction =
  | "user.registered"
  | "agreement.created"
  | "agreement.signed"
  | "deposit.submitted"
  | "deposit.confirmed"
  | "payment.released"
  | "agreement.completed";

export type ActivityActorType = "user" | "admin" | "system";

export type ActivityEventInput = {
  actor_type: ActivityActorType;
  actor_id?: string | null;
  action: ActivityAction;
  agreement_id?: string | null;
  meta?: Record<string, unknown>;
};

/** Best-effort append; never throws into the caller’s critical path. */
export async function recordActivityEvent(
  input: ActivityEventInput,
  client?: SupabaseClient
): Promise<void> {
  try {
    let supabase = client;
    if (!supabase) {
      const admin = getAdminSupabase();
      if ("error" in admin) return;
      supabase = admin.supabase;
    }

    const payload = {
      actor_type: input.actor_type,
      actor_id: input.actor_id ?? null,
      action: input.action,
      agreement_id: input.agreement_id ?? null,
      meta: input.meta ?? {}
    };

    const { error } = await supabase.from("activity_events").insert(payload);
    if (error && !isMissingColumnOrSchemaCacheError(error.message)) {
      // Table may not exist yet until migration is applied — ignore quietly.
      if (!error.message.toLowerCase().includes("activity_events")) {
        console.warn("[activity]", error.message);
      }
    }
  } catch (err) {
    console.warn("[activity]", err instanceof Error ? err.message : err);
  }
}
