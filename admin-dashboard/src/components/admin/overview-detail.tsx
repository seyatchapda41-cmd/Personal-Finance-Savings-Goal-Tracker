import Link from "next/link";
import { ClientsTable } from "@/components/admin/clients-table";
import { TransactionsTable } from "@/components/admin/transactions-table";
import { ActionButton } from "@/components/admin/action-button";
import { ScrollTo } from "@/components/admin/scroll-to";
import { Badge, Card, EmptyState } from "@/components/admin/ui";
import { adminRefundPaymentAction } from "@/app/actions/admin";
import type { AdminSnapshot } from "@/lib/admin/data";
import type { Permission } from "@/lib/admin/rbac";
import { formatMoney } from "@/lib/format";
import { PLANS, normalizePlan } from "@/lib/plans";

export const OVERVIEW_BOXES = [
  "clients",
  "recurring",
  "collected",
  "support",
  "conversion",
  "recent",
  "suspended",
  "records",
] as const;

export type OverviewBox = (typeof OVERVIEW_BOXES)[number];

export function isOverviewBox(value: string | undefined): value is OverviewBox {
  return OVERVIEW_BOXES.includes(value as OverviewBox);
}

const TITLES: Record<OverviewBox, { title: string; description: string }> = {
  clients: {
    title: "Every client",
    description: "Names, phones and plans. Open a row or delete from here.",
  },
  recurring: {
    title: "Premium accounts",
    description: "These clients produce monthly recurring revenue.",
  },
  collected: {
    title: "Payments collected",
    description: "Each Premium checkout that reached this panel.",
  },
  support: {
    title: "Open support",
    description: "Requests still waiting. Open a conversation to reply.",
  },
  conversion: {
    title: "Premium vs Standard",
    description: "Who is paying and who is on the free plan.",
  },
  recent: {
    title: "New in the last 30 days",
    description: "Accounts created recently.",
  },
  suspended: {
    title: "Suspended accounts",
    description: "Blocked clients. Restore or delete after you read the file.",
  },
  records: {
    title: "Client records",
    description: "Income and expense rows across every client.",
  },
};

export function OverviewDetail({
  box,
  snapshot,
  permissions,
}: {
  box: OverviewBox;
  snapshot: AdminSnapshot;
  permissions: readonly Permission[];
}) {
  const copy = TITLES[box];
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const clients =
    box === "recurring"
      ? snapshot.clients.filter((c) => c.plan === "premium")
      : box === "conversion"
        ? [...snapshot.clients].sort((a, b) =>
            a.plan === b.plan ? 0 : a.plan === "premium" ? -1 : 1,
          )
        : box === "recent"
          ? snapshot.clients.filter(
              (c) => c.createdAt && new Date(c.createdAt).getTime() >= since,
            )
          : box === "suspended"
            ? snapshot.clients.filter((c) => c.suspended)
            : box === "clients"
              ? snapshot.clients
              : null;
  const openSupport = snapshot.support.filter((s) => s.status === "open");

  return (
    <section id="overview-details" className="scroll-mt-8 space-y-4">
      <ScrollTo targetId="overview-details" trigger={box} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{copy.title}</h3>
          <p className="ad-muted mt-1 text-sm">{copy.description}</p>
        </div>
        <Link href="/" className="ad-btn">
          Close details
        </Link>
      </div>

      {clients ? (
        clients.length === 0 ? (
          <EmptyState
            title="Nobody in this box"
            description="When a matching client exists, their name appears here."
          />
        ) : (
          <ClientsTable clients={clients} permissions={permissions} />
        )
      ) : null}

      {box === "collected" ? (
        snapshot.payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="Premium checkouts appear here with the client phone."
          />
        ) : (
          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>State</th>
                    <th>When</th>
                    <th>Control</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.payments.map((payment) => {
                    const client = snapshot.clients.find(
                      (c) => c.phone === payment.phone,
                    );
                    return (
                      <tr key={payment.ref}>
                        <td>
                          <span className="block font-medium">
                            {client?.fullName ?? payment.phone ?? "Unlinked"}
                          </span>
                          <span className="ad-muted block text-xs">
                            {payment.phone ?? "No phone yet"}
                          </span>
                        </td>
                        <td>
                          <span className="ad-kbd">{payment.ref}</span>
                        </td>
                        <td className="tabular-nums">
                          {formatMoney(payment.amount)}
                        </td>
                        <td>
                          <Badge
                            tone={payment.status === "refunded" ? "warn" : "good"}
                          >
                            {payment.status}
                          </Badge>
                        </td>
                        <td className="ad-muted text-xs whitespace-nowrap">
                          {payment.createdAt
                            ? new Date(payment.createdAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {payment.status === "paid" &&
                          permissions.includes("payments.refund") ? (
                            <ActionButton
                              action={adminRefundPaymentAction}
                              fields={{ ref: payment.ref }}
                              label="Refund"
                              confirmLabel="Confirm refund"
                              confirm
                            />
                          ) : (
                            <span className="ad-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : null}

      {box === "support" ? (
        openSupport.length === 0 ? (
          <EmptyState
            title="No open requests"
            description="New messages from clients land here until they are answered."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {openSupport.map((item) => (
              <Card key={item.ref}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.subject}</p>
                    <p className="ad-muted mt-1 text-xs">
                      {item.fullName || item.phone} ·{" "}
                      {PLANS[normalizePlan(item.plan)].label}
                    </p>
                  </div>
                  <Badge tone={item.priority === "priority" ? "brand" : "warn"}>
                    {item.priority === "priority" ? "Priority" : "Open"}
                  </Badge>
                </div>
                <p className="ad-soft mt-3 text-sm whitespace-pre-wrap">
                  {item.message}
                </p>
                <Link
                  href={`/support?thread=${encodeURIComponent(item.ref)}`}
                  className="mt-3 inline-block text-xs"
                  style={{ color: "var(--ad-brand-text)" }}
                >
                  Open conversation
                </Link>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {box === "records" ? (
        snapshot.transactions.length === 0 ? (
          <EmptyState
            title="No records yet"
            description="Income and expense rows from every client appear here."
          />
        ) : (
          <TransactionsTable
            transactions={snapshot.transactions}
            permissions={permissions}
          />
        )
      ) : null}
    </section>
  );
}
