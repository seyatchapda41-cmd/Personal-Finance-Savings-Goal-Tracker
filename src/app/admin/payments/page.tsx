import { notFound } from "next/navigation";
import { adminRefundPaymentAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/admin/ui";
import { loadAdminSnapshot, summarise } from "@/lib/admin/data";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { formatMoney } from "@/lib/format";

export default async function AdminPaymentsPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "payments.view")) notFound();

  const snapshot = await loadAdminSnapshot();
  const totals = summarise(snapshot);
  const mayRefund = can(session.role, "payments.refund");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every Premium payment taken through checkout."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Collected"
          value={formatMoney(totals.revenue)}
          hint="Excludes refunded payments"
          icon="revenue"
          tone="good"
        />
        <StatCard
          label="Monthly recurring"
          value={formatMoney(totals.monthlyRecurring)}
          hint={`${totals.premium} Premium accounts`}
        />
        <StatCard
          label="Refunded"
          value={totals.refunded}
          hint="Marked refunded in this panel"
          tone={totals.refunded > 0 ? "warn" : "neutral"}
        />
      </div>

      {snapshot.payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Each Premium purchase appears here with its reference and card ending."
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Card</th>
                  <th>State</th>
                  <th>Control</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.payments.map((payment) => (
                  <tr key={payment.ref}>
                    <td className="whitespace-nowrap">
                      <span className="ad-kbd">{payment.ref}</span>
                    </td>
                    <td>{payment.phone ?? "Not yet linked"}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {payment.amountLabel || formatMoney(payment.amount)}
                    </td>
                    <td className="ad-muted">
                      {payment.cardLast4 ? `ends ${payment.cardLast4}` : "—"}
                    </td>
                    <td>
                      {payment.status === "refunded" ? (
                        <Badge tone="warn">Refunded</Badge>
                      ) : (
                        <Badge tone="good">Paid</Badge>
                      )}
                    </td>
                    <td>
                      {payment.status === "refunded" ? (
                        <span className="ad-muted text-xs">Closed</span>
                      ) : mayRefund ? (
                        <ActionButton
                          action={adminRefundPaymentAction}
                          fields={{ ref: payment.ref }}
                          label="Mark refunded"
                          confirm
                        />
                      ) : (
                        <span className="ad-muted text-xs">Founder only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="ad-muted text-xs">
        Marking a payment refunded records your decision here. Returning the
        money still happens with the card provider.
      </p>
    </div>
  );
}
