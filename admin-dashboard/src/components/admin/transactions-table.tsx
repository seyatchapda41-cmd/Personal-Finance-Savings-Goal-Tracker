"use client";

import Link from "next/link";
import { TransactionActions } from "@/components/admin/transaction-actions";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/admin/ui";
import type { AdminCategory, AdminTransaction } from "@/lib/admin/data";
import type { Permission } from "@/lib/admin/rbac";
import { formatDate, formatMoney } from "@/lib/format";

export function signedFlow(row: AdminTransaction) {
  const direction = row.type === "income" ? 1 : -1;
  const flip = row.origin === "reversal" ? -1 : 1;
  return row.amount * direction * flip;
}

const ORIGIN_LABEL: Record<AdminTransaction["origin"], string> = {
  client: "Client",
  admin: "Staff",
  reversal: "Reversal",
};

export function TransactionsTable({
  transactions,
  permissions,
  showClient = true,
  categories,
}: {
  transactions: AdminTransaction[];
  permissions: readonly Permission[];
  showClient?: boolean;
  categories?: AdminCategory[];
}) {
  const columns: Column<AdminTransaction>[] = [
    {
      key: "date",
      header: "Date",
      sortValue: (row) => row.date,
      cell: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span>,
    },
    ...(showClient
      ? [
          {
            key: "client",
            header: "Client",
            sortValue: (row: AdminTransaction) => row.fullName.toLowerCase(),
            cell: (row: AdminTransaction) => (
              <div>
                <Link
                  href={`/clients/${row.clientId}`}
                  className="block font-medium"
                  style={{ color: "var(--ad-brand-text)" }}
                >
                  {row.fullName}
                </Link>
                <span className="ad-muted block text-xs">{row.phone}</span>
              </div>
            ),
          },
        ]
      : []),
    {
      key: "category",
      header: "Category",
      sortValue: (row) => row.categoryName,
      cell: (row) => (
        <Badge tone={row.type === "income" ? "good" : "neutral"}>
          {row.categoryName}
        </Badge>
      ),
    },
    {
      key: "description",
      header: "Detail",
      cell: (row) => (
        <span className="ad-soft block max-w-52 truncate">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origin",
      sortValue: (row) => row.origin,
      cell: (row) => (
        <div className="space-y-1">
          <Badge
            tone={
              row.origin === "reversal"
                ? "warn"
                : row.origin === "admin"
                  ? "brand"
                  : "neutral"
            }
          >
            {ORIGIN_LABEL[row.origin]}
          </Badge>
          {row.reversedById ? <Badge tone="warn">Reversed</Badge> : null}
          {row.flagged ? (
            <span className="ad-muted block max-w-36 truncate text-xs">
              Flagged{row.flagReason ? `: ${row.flagReason}` : ""}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (row) => signedFlow(row),
      cell: (row) => {
        const signed = signedFlow(row);
        return (
          <span
            className="whitespace-nowrap tabular-nums font-medium"
            style={{
              color: signed >= 0 ? "var(--ad-good)" : "var(--ad-bad)",
            }}
          >
            {signed >= 0 ? "+" : "−"}
            {formatMoney(Math.abs(signed))}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Control",
      cell: (row) => (
        <TransactionActions
          row={row}
          permissions={permissions}
          categories={categories}
        />
      ),
    },
  ];

  return (
    <DataTable
      rows={transactions}
      columns={columns}
      searchPlaceholder="Search client, category or detail…"
      searchKeys={(row) => [
        row.fullName,
        row.phone,
        row.categoryName,
        row.description,
        ORIGIN_LABEL[row.origin],
      ]}
      filters={[
        {
          key: "type",
          label: "Type",
          options: [
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ],
        },
        {
          key: "origin",
          label: "Origin",
          options: [
            { value: "client", label: "Client" },
            { value: "admin", label: "Staff" },
            { value: "reversal", label: "Reversal" },
          ],
        },
        {
          key: "review",
          label: "Review",
          options: [
            { value: "flagged", label: "Flagged" },
            { value: "reversed", label: "Reversed" },
            { value: "live", label: "Live" },
          ],
        },
      ]}
      filterMatch={(row, key, value) => {
        if (key === "type") return row.type === value;
        if (key === "origin") return row.origin === value;
        if (key === "review") {
          if (value === "flagged") return row.flagged;
          if (value === "reversed") return Boolean(row.reversedById);
          if (value === "live") return !row.reversedById && row.origin !== "reversal";
        }
        return true;
      }}
      pageSize={30}
    />
  );
}
