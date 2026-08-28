"use client";

import Link from "next/link";
import { ClientActions } from "@/components/admin/client-actions";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/admin/ui";
import type { AdminClient } from "@/lib/admin/data";
import type { Permission } from "@/lib/admin/rbac";
import { formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";

export function ClientsTable({
  clients,
  permissions,
}: {
  clients: AdminClient[];
  permissions: readonly Permission[];
}) {
  const columns: Column<AdminClient>[] = [
    {
      key: "client",
      header: "Client",
      sortValue: (row) => row.fullName.toLowerCase(),
      cell: (row) => (
        <div className="min-w-44">
          <Link
            href={`/admin/clients/${row.id}`}
            className="block font-medium"
            style={{ color: "var(--ad-brand-text)" }}
          >
            {row.fullName}
          </Link>
          <span className="ad-muted block text-xs">{row.phone}</span>
          {row.email ? (
            <span className="ad-muted block text-xs">{row.email}</span>
          ) : null}
          <Link
            href={`/admin/clients/${row.id}`}
            className="mt-1 inline-block text-xs"
            style={{ color: "var(--ad-brand-text)" }}
          >
            View details
          </Link>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      sortValue: (row) => row.plan,
      cell: (row) => (
        <Badge tone={row.plan === "premium" ? "brand" : "neutral"}>
          {PLANS[row.plan].label}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => (row.suspended ? 1 : 0),
      cell: (row) =>
        row.suspended ? (
          <span className="space-y-1">
            <Badge tone="bad">Suspended</Badge>
            {row.suspendedReason ? (
              <span className="ad-muted block max-w-40 text-xs">
                {row.suspendedReason}
              </span>
            ) : null}
          </span>
        ) : (
          <Badge tone="good">Active</Badge>
        ),
    },
    {
      key: "records",
      header: "Records",
      align: "right",
      sortValue: (row) => row.transactionCount,
      cell: (row) => (
        <span className="ad-soft tabular-nums">
          {row.transactionCount} tx · {row.goalCount} goals
        </span>
      ),
    },
    {
      key: "flow",
      header: "In / out",
      align: "right",
      sortValue: (row) => row.income - row.expense,
      cell: (row) => (
        <span className="tabular-nums">
          <span style={{ color: "var(--ad-good)" }}>
            {formatMoney(row.income)}
          </span>
          <span className="ad-muted"> / </span>
          <span style={{ color: "var(--ad-bad)" }}>
            {formatMoney(row.expense)}
          </span>
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      sortValue: (row) => row.createdAt ?? "",
      cell: (row) => (
        <span className="ad-muted text-xs">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString()
            : "unknown"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Control",
      cell: (row) => (
        <ClientActions
          client={{
            id: row.id,
            phone: row.phone,
            fullName: row.fullName,
            plan: row.plan,
            suspended: row.suspended,
          }}
          permissions={permissions}
        />
      ),
    },
  ];

  return (
    <DataTable
      rows={clients}
      columns={columns}
      searchPlaceholder="Search name, phone or email…"
      searchKeys={(row) => [row.fullName, row.phone, row.email]}
      filters={[
        {
          key: "plan",
          label: "Plan",
          options: [
            { value: "premium", label: "Premium" },
            { value: "free", label: "Standard" },
          ],
        },
        {
          key: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ],
        },
      ]}
      filterMatch={(row, key, value) => {
        if (key === "plan") return row.plan === value;
        if (key === "status") {
          return value === "suspended" ? row.suspended : !row.suspended;
        }
        return true;
      }}
    />
  );
}
