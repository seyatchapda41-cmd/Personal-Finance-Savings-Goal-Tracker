import {
  adminDeleteClientAction,
  adminSetPlanAction,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { PasswordReset } from "@/components/admin/password-reset";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export default async function AdminClientsPage() {
  const snapshot = await loadAdminSnapshot();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Clients</h1>
        <p className="mt-2 text-sm text-mute">
          {snapshot.clients.length} account
          {snapshot.clients.length === 1 ? "" : "s"}. Change a plan, or close an
          account and everything on it.
        </p>
      </header>

      {snapshot.clients.length === 0 ? (
        <p className="card text-sm">No accounts yet.</p>
      ) : (
        <div className="card on-blue overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Records</th>
                <th className="pb-2 font-medium">In / out</th>
                <th className="pb-2 font-medium">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {snapshot.clients.map((client) => (
                <tr key={client.id}>
                  <td className="py-3">
                    <span className="block font-medium">{client.fullName}</span>
                    <span className="block text-xs text-mute">
                      {client.phone}
                      {client.email ? ` · ${client.email}` : ""}
                    </span>
                  </td>
                  <td className="py-3">{PLANS[client.plan].label}</td>
                  <td className="py-3 text-mute">
                    {client.transactionCount} tx · {client.goalCount} goals
                  </td>
                  <td className="py-3 text-mute">
                    {formatMoney(client.income)} / {formatMoney(client.expense)}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton
                        action={adminSetPlanAction}
                        fields={{
                          clientId: client.id,
                          phone: client.phone,
                          plan: client.plan === "premium" ? "free" : "premium",
                        }}
                        label={
                          client.plan === "premium"
                            ? "Move to Standard"
                            : "Move to Premium"
                        }
                      />
                      <PasswordReset clientId={client.id} />
                      <ActionButton
                        action={adminDeleteClientAction}
                        fields={{ clientId: client.id, phone: client.phone }}
                        label="Delete"
                        confirmLabel="Confirm delete"
                        className="btn-danger"
                        confirm
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
