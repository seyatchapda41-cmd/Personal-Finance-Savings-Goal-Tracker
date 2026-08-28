"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRemoveTeamMemberAction, adminSaveTeamMemberAction } from "@/app/actions/admin";
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
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <h3 className="font-semibold">Add a moderator</h3>
        <p className="ad-muted mt-2 text-sm">
          They must already have a client account on that phone. Moderators can
          run day-to-day work. They cannot change billing, settings, or the team.
        </p>
        <form
          className="mt-4 space-y-3"
          action={async (formData) => {
            setPending(true);
            setError(null);
            const result = await adminSaveTeamMemberAction(formData);
            if (result.error) setError(result.error);
            else router.refresh();
            setPending(false);
          }}
        >
          <label className="block text-sm">
            Phone
            <input className="ad-input mt-1" name="phone" required placeholder="+237…" />
          </label>
          <label className="block text-sm">
            Name
            <input className="ad-input mt-1" name="fullName" placeholder="Optional" />
          </label>
          <input type="hidden" name="role" value="moderator" />
          {error ? (
            <p className="text-sm" style={{ color: "var(--ad-bad)" }}>
              {error}
            </p>
          ) : null}
          <button className="ad-btn ad-btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Give staff access"}
          </button>
        </form>
      </Card>
    </div>
  );
}
