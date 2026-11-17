import { notFound } from "next/navigation";
import { ClientsTable } from "@/components/admin/clients-table";
import { EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { can, permissionsFor } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";

export default async function AdminClientsPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "clients.view")) notFound();

  const snapshot = await loadAdminSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Every other account saved in the database is listed here. Delete account removes that person, their password, and their records. Your own founder account stays."
      />

      {snapshot.mode === "demo" ? (
        <Notice>
          <p>
            No database is connected, so only accounts created in this browser
            appear, and their records cannot be reached.
          </p>
        </Notice>
      ) : null}

      {snapshot.clients.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Clients appear here as soon as they sign up."
        />
      ) : (
        <ClientsTable
          clients={snapshot.clients}
          permissions={permissionsFor(session.role)}
        />
      )}
    </div>
  );
}
