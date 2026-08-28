import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientActions } from "@/components/admin/client-actions";
import { AdjustmentForm } from "@/components/admin/client-ledger";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { can, permissionsFor } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { formatDate, formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export default async function ClientLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "clients.view")) notFound();

  const { id } = await params;
  const snapshot = await loadAdminSnapshot();
  const client = snapshot.clients.find((row) => row.id === id);
  if (!client) notFound();

  const permissions = permissionsFor(session.role);
  const transactions = snapshot.transactions.filter((row) => row.clientId === id);
  const categories = snapshot.categories.filter((row) => row.clientId === id);
  const goals = snapshot.goals.filter((row) => row.clientId === id);
  const payments = snapshot.payments.filter((row) => row.phone === client.phone);
  const support = snapshot.support.filter((row) => row.phone === client.phone);
  const net = client.income - client.expense;
  const flagged = transactions.filter((row) => row.flagged).length;
  const lastRecord = transactions[0];
  const facts: { label: string; value: string }[] = [
    { label: "Name", value: client.fullName },
    { label: "Phone", value: client.phone || "—" },
    { label: "Email", value: client.email || "—" },
    { label: "Plan", value: PLANS[client.plan].label },
    { label: "Status", value: client.suspended ? "Suspended" : "Active" },
    {
      label: "Joined",
      value: client.createdAt
        ? new Date(client.createdAt).toLocaleString()
        : "unknown",
    },
    {
      label: "Last record",
      value: lastRecord
        ? `${formatDate(lastRecord.date)} · ${lastRecord.categoryName} · ${lastRecord.description || "no note"}`
        : "None yet",
    },
    {
      label: "Payments",
      value: `${payments.length} · ${support.length} support request${support.length === 1 ? "" : "s"}`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.fullName}
        description="Read the account, then keep it or delete it. Deleting removes the client and every record on this account."
        actions={
          <Link href="/admin/clients" className="ad-btn">
            All clients
          </Link>
        }
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">{client.fullName}</h3>
            <p className="ad-muted mt-1 text-sm">
              {client.phone}
              {client.email ? ` · ${client.email}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={client.plan === "premium" ? "brand" : "neutral"}>
              {PLANS[client.plan].label}
            </Badge>
            <Badge tone={client.suspended ? "bad" : "good"}>
              {client.suspended ? "Suspended" : "Active"}
            </Badge>
          </div>
        </div>

        {client.suspended && client.suspendedReason ? (
          <p className="ad-muted mt-3 text-sm">
            Suspended because: {client.suspendedReason}
          </p>
        ) : null}

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--ad-border)" }}>
              <dt className="ad-muted text-xs uppercase tracking-wide">{fact.label}</dt>
              <dd className="mt-1 text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--ad-border)" }}>
          <p className="ad-muted mb-3 text-xs">
            Decide here. Delete names this person and asks once more.
          </p>
          <ClientActions
            client={{
              id: client.id,
              phone: client.phone,
              fullName: client.fullName,
              plan: client.plan,
              suspended: client.suspended,
            }}
            permissions={permissions}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={formatMoney(client.income)} tone="good" />
        <StatCard label="Expenses" value={formatMoney(client.expense)} tone="bad" />
        <StatCard
          label="Net"
          value={formatMoney(net)}
          hint={`${transactions.length} records`}
          tone={net >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Goals"
          value={goals.length}
          hint={flagged ? `${flagged} flagged for review` : "No flags"}
        />
      </div>

      {support.length > 0 ? (
        <Card>
          <h3 className="font-semibold">Support conversations</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {support.map((item) => (
              <li
                key={item.ref}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span>
                  <span className="block font-medium">{item.subject}</span>
                  <span className="ad-muted text-xs">
                    {item.status} · {item.ref}
                    {item.replies.length > 0
                      ? ` · ${item.replies.length} repl${item.replies.length === 1 ? "y" : "ies"}`
                      : ""}
                  </span>
                </span>
                <Link
                  href={`/admin/support?thread=${encodeURIComponent(item.ref)}`}
                  className="ad-btn"
                >
                  Open conversation
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {goals.length > 0 ? (
        <Card>
          <h3 className="font-semibold">Savings goals</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {goals.map((goal) => (
              <li key={goal.id} className="flex justify-between gap-3">
                <span>{goal.title}</span>
                <span className="tabular-nums">
                  {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {can(session.role, "transactions.adjust") ? (
        <Card>
          <h3 className="font-semibold">Post a staff correction</h3>
          <p className="ad-muted mt-1 text-sm">
            The client will see this row and cannot delete it.
          </p>
          <div className="mt-4">
            <AdjustmentForm
              clientId={client.id}
              categories={categories}
              permissions={permissions}
            />
          </div>
        </Card>
      ) : null}

      <div>
        <h3 className="mb-3 font-semibold">Transaction detail</h3>
        {transactions.length === 0 ? (
          <EmptyState
            title="No records on this account"
            description="Rows appear when the client logs income or expenses, or when you post a correction."
          />
        ) : (
          <TransactionsTable
            transactions={transactions}
            permissions={permissions}
            showClient={false}
            categories={categories}
          />
        )}
      </div>
    </div>
  );
}
