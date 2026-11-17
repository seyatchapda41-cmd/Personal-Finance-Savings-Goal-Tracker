import { notFound } from "next/navigation";
import { ExportTransactionsButton } from "@/components/admin/export-transactions";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { EmptyState, Notice, PageHeader, StatCard } from "@/components/admin/ui";
import { loadAdminSnapshot, summarise } from "@/lib/admin/data";
import { can, permissionsFor } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { formatMoney } from "@/lib/format";

export default async function AdminTransactionsPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "transactions.view")) notFound();

  const snapshot = await loadAdminSnapshot();
  const totals = summarise(snapshot);
  const permissions = permissionsFor(session.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Every record from every client. Cancel a mistake, reverse a row so history stays, or open a client's books to post a correction."
        actions={
          can(session.role, "transactions.export") ? (
            <ExportTransactionsButton transactions={snapshot.transactions} />
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Records"
          value={totals.transactions}
          hint="Across every client account"
        />
        <StatCard
          label="Income"
          value={formatMoney(totals.income)}
          tone="good"
        />
        <StatCard
          label="Expenses"
          value={formatMoney(totals.expense)}
          hint={totals.flagged ? `${totals.flagged} flagged` : "None flagged"}
          tone="bad"
        />
      </div>

      {snapshot.transactions.length === 0 ? (
        <>
          {snapshot.mode === "demo" ? (
            <Notice>
              <p>
                Client records live in each client&apos;s own browser while no
                database is connected, so they cannot be listed or managed
                from here.
              </p>
            </Notice>
          ) : null}
          <EmptyState
            title="No transactions yet"
            description="Records appear as soon as clients start adding income and expenses."
          />
        </>
      ) : (
        <TransactionsTable
          transactions={snapshot.transactions}
          permissions={permissions}
        />
      )}
    </div>
  );
}
