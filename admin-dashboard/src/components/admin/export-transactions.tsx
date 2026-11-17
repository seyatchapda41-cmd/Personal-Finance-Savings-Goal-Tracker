"use client";

import { todayIso } from "@/lib/format";
import type { AdminTransaction } from "@/lib/admin/data";
import { signedFlow } from "@/components/admin/transactions-table";

export function ExportTransactionsButton({
  transactions,
}: {
  transactions: AdminTransaction[];
}) {
  function download() {
    const header = "date,client,phone,category,type,origin,description,amount,signed,flagged";
    const lines = transactions.map((row) => {
      const signed = signedFlow(row);
      const description = row.description.replaceAll('"', '""');
      return [
        row.date,
        `"${row.fullName.replaceAll('"', '""')}"`,
        row.phone,
        `"${row.categoryName.replaceAll('"', '""')}"`,
        row.type,
        row.origin,
        `"${description}"`,
        row.amount,
        signed,
        row.flagged ? "yes" : "no",
      ].join(",");
    });
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tempora-client-transactions-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="ad-btn ad-btn-primary" onClick={download}>
      Export CSV
    </button>
  );
}
