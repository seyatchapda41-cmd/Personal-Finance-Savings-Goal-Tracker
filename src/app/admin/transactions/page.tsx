import { adminCancelTransactionAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AdminTransactionsPage() {
  const snapshot = await loadAdminSnapshot();
  const rows = snapshot.transactions.slice(0, 200);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Transactions</h1>
        <p className="mt-2 text-sm text-mute">
          Every record from every client, newest first. Cancelling one removes it
          from that client&apos;s books.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="card space-y-2 text-sm">
          <p>No transactions to show.</p>
          {snapshot.mode === "demo" ? (
            <p className="text-mute">
              Client records live in each client&apos;s own browser while no
              database is connected, so they cannot be listed here. Connect
              Supabase to see and cancel them.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card on-blue overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Detail</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 whitespace-nowrap">
                    {formatDate(row.date)}
                  </td>
                  <td className="py-3">
                    <span className="block">{row.fullName}</span>
                    <span className="block text-xs text-mute">{row.phone}</span>
                  </td>
                  <td className="py-3">{row.categoryName}</td>
                  <td className="py-3 text-mute">{row.description || "—"}</td>
                  <td
                    className={`py-3 whitespace-nowrap ${
                      row.type === "income" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {row.type === "income" ? "+" : "−"}
                    {formatMoney(row.amount)}
                  </td>
                  <td className="py-3">
                    <ActionButton
                      action={adminCancelTransactionAction}
                      fields={{ transactionId: row.id }}
                      label="Cancel"
                      confirmLabel="Confirm cancel"
                      className="btn-danger"
                      confirm
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {snapshot.transactions.length > rows.length ? (
            <p className="mt-3 text-xs text-mute">
              Showing the newest {rows.length} of {snapshot.transactions.length}.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
