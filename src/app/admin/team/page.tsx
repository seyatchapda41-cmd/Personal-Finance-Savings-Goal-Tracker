import { notFound } from "next/navigation";
import { TeamManager } from "@/components/admin/team-manager";
import { Card, PageHeader } from "@/components/admin/ui";
import { loadAdminTeam } from "@/lib/admin/data";
import { can, permissionsFor, ROLE_BLURB, ROLE_LABEL } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";

export default async function AdminTeamPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "team.manage")) notFound();

  const team = await loadAdminTeam();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin team"
        description="Add moderators, set their role, and remove access. Every change is written to the audit trail, including who posted a staff correction."
      />

      <TeamManager team={team} currentPhone={session.phone} />

      <div className="grid gap-4 sm:grid-cols-2">
        {(["founder", "moderator"] as const).map((role) => (
          <Card key={role}>
            <h3 className="font-semibold">{ROLE_LABEL[role]}</h3>
            <p className="ad-soft mt-1 text-sm">{ROLE_BLURB[role]}</p>
            <ul className="ad-muted mt-3 space-y-1 text-xs">
              {permissionsFor(role).map((permission) => (
                <li key={permission}>{permission}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
