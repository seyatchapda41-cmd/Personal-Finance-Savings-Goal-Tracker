import { adminRefundPaymentAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { loadAdminSnapshot, summarise } from "@/lib/admin/data";
import { formatMoney } from "@/lib/format";

export default async function AdminPaymentsPage() {
  const snapshot = await loadAdminSnapshot();
  const totals = summarise(snapshot);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Payments</h1>
        <p className="mt-2 text-sm text-mute">
          {formatMoney(totals.revenue)} collected across{" "}
          {snapshot.payments.length} payment
          {snapshot.payments.length === 1 ? "" : "s"}.
        </p>
      </header>

      {snapshot.payments.length === 0 ? (
        <p className="card text-sm">
          No Premium payments yet. Each one made through checkout appears here.
        </p>
      ) : (
        <div className="card on-blue overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-2 font-medium">Reference</th>
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Card</th>
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 font-medium">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {snapshot.payments.map((payment) => (
                <tr key={payment.ref}>
                  <td className="py-3 whitespace-nowrap">{payment.ref}</td>
                  <td className="py-3">{payment.phone ?? "Not yet linked"}</td>
                  <td className="py-3 whitespace-nowrap">
                    {payment.amountLabel || formatMoney(payment.amount)}
                  </td>
                  <td className="py-3 text-mute">
                    {payment.cardLast4 ? `ends ${payment.cardLast4}` : "—"}
                  </td>
                  <td className="py-3">
                    {payment.status === "refunded" ? "Refunded" : "Paid"}
                  </td>
                  <td className="py-3">
                    {payment.status === "refunded" ? (
                      <span className="text-xs text-mute">Closed</span>
                    ) : (
                      <ActionButton
                        action={adminRefundPaymentAction}
                        fields={{ ref: payment.ref }}
                        label="Mark refunded"
                        confirm
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-mute">
            Marking a payment refunded records your decision here. Returning the
            money still happens with the card provider.
          </p>
        </div>
      )}
    </div>
  );
}
