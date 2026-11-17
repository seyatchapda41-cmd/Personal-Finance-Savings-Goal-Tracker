"use client";

import { adminRemoveTeamMemberAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { Badge, Card } from "@/components/admin/ui";
import type { AdminTeamMember } from "@/lib/admin/data";
import { ROLE_LABEL } from "@/lib/admin/rbac";

export function TeamManager({
  team,
  currentPhone,
}: {
  team: AdminTeamMember[];
  currentPhone: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2" padded={false}>
        <div className="overflow-x-auto">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Role</th>
                <th>Added by</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.phone}>
                  <td>
                    <span className="block font-medium">
                      {member.fullName}
                      {member.phone === currentPhone ? " (you)" : ""}
                    </span>
                    <span className="ad-muted block text-xs">{member.phone}</span>
                  </td>
                  <td>
                    <Badge tone={member.role === "founder" ? "brand" : "neutral"}>
                      {ROLE_LABEL[member.role]}
                    </Badge>
                  </td>
                  <td className="ad-muted text-xs">
                    {member.bootstrapped ? "ADMIN_PHONES" : member.createdBy || "—"}
                  </td>
                  <td>
                    {member.role === "founder" || member.bootstrapped ? (
                      <span className="ad-muted text-xs">Founder seat</span>
                    ) : member.phone === currentPhone ? (
                      <span className="ad-muted text-xs">Cannot remove yourself</span>
                    ) : (
                      <ActionButton
                        action={adminRemoveTeamMemberAction}
                        fields={{ phone: member.phone }}
                        label="Remove"
                        confirmLabel="Confirm remove"
                        className="ad-btn ad-btn-danger"
                        confirm
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold">Founder only</h3>
        <p className="ad-muted mt-2 text-sm">
          This panel is locked to the founder. Extra staff cannot be given a
          key.
        </p>
      </Card>
    </div>
  );
}
