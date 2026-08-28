"use client";

import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/admin/ui";
import type { AdminAuditEntry } from "@/lib/admin/data";

export function AuditTable({ entries }: { entries: AdminAuditEntry[] }) {
  const columns: Column<AdminAuditEntry>[] = [
    {
      key: "when",
      header: "When",
      sortValue: (row) => row.createdAt,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Admin",
      sortValue: (row) => row.actorPhone,
      cell: (row) => (
        <div>
          <span className="block">{row.actorPhone}</span>
          <span className="ad-muted block text-xs capitalize">
            {row.actorRole}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      sortValue: (row) => row.action,
      cell: (row) => <span className="ad-kbd">{row.action}</span>,
    },
    {
      key: "target",
      header: "Target",
      cell: (row) => (
        <span className="ad-soft">
          {row.targetLabel || "—"}
          {row.targetType ? (
            <span className="ad-muted text-xs"> ({row.targetType})</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      sortValue: (row) => row.outcome,
      cell: (row) => (
        <Badge
          tone={
            row.outcome === "success"
              ? "good"
              : row.outcome === "denied"
                ? "bad"
                : "warn"
          }
        >
          {row.outcome}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      rows={entries}
      columns={columns}
      searchPlaceholder="Search admin, action or target…"
      searchKeys={(row) => [
        row.actorPhone,
        row.action,
        row.targetLabel,
        row.targetType,
      ]}
      filters={[
        {
          key: "outcome",
          label: "Outcome",
          options: [
            { value: "success", label: "Success" },
            { value: "denied", label: "Denied" },
            { value: "error", label: "Error" },
          ],
        },
      ]}
      filterMatch={(row, key, value) =>
        key === "outcome" ? row.outcome === value : true
      }
      pageSize={40}
    />
  );
}
