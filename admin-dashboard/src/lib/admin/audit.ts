import { isSupabaseConfigured } from "@/lib/config";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { AdminRole } from "@/lib/admin/rbac";

export type AuditEntry = {
  actorPhone: string;
  actorRole: AdminRole;
  action: string;
  targetType?: string;
  targetLabel?: string;
  detail?: Record<string, unknown>;
  outcome?: "success" | "denied" | "error";
};

// Written for refused attempts as well as successful ones, so the trail shows
// what someone tried to do and not only what they managed.
export async function recordAudit(entry: AuditEntry) {
  const row = {
    actor_phone: entry.actorPhone,
    actor_role: entry.actorRole,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_label: entry.targetLabel ?? null,
    detail: entry.detail ?? null,
    outcome: entry.outcome ?? "success",
  };

  if (!isSupabaseConfigured()) {
    console.info("[audit]", JSON.stringify(row));
    return;
  }

  const supabase = createAdminSupabase();
  if (!supabase) return;
  const { error } = await supabase.from("admin_audit_log").insert(row);
  // An unwritten trail must never break the action it describes.
  if (error) console.error("[audit] could not record entry:", error.message);
}
