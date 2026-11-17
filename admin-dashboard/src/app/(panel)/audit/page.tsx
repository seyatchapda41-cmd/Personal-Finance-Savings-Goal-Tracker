import { notFound } from "next/navigation";
import { AuditTable } from "@/components/admin/audit-table";
import { EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { loadAuditTrail } from "@/lib/admin/data";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/config";

export default async function AdminAuditPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "audit.view")) notFound();

  const entries = await loadAuditTrail(300);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="Who did what, and when. Refused attempts are recorded too, so an admin reaching past their role leaves a mark."
      />

      {!isSupabaseConfigured() ? (
        <Notice>
          <p>
            Without a database the trail is written to the server log instead of
            being stored, so nothing can be listed here.
          </p>
        </Notice>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description="The first action taken in this panel will appear here."
        />
      ) : (
        <AuditTable entries={entries} />
      )}
    </div>
  );
}
