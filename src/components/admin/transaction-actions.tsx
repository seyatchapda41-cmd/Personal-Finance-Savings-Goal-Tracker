"use client";

import { useState } from "react";
import {
  adminCancelTransactionAction,
  adminReverseTransactionAction,
  adminReviewTransactionAction,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { TransactionEditForm } from "@/components/admin/client-ledger";
import type { AdminCategory, AdminTransaction } from "@/lib/admin/data";
import type { Permission } from "@/lib/admin/rbac";

export function TransactionActions({
  row,
  permissions,
  categories,
}: {
  row: AdminTransaction;
  permissions: readonly Permission[];
  categories?: AdminCategory[];
}) {
  const allowed = (permission: Permission) => permissions.includes(permission);
  const live = !row.reversedById;
  const clientOwned = row.origin === "client";
  const [flagOpen, setFlagOpen] = useState(false);
  const [reason, setReason] = useState(row.flagReason);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const label = `${row.phone} ${row.categoryName} ${row.amount}`;

  async function setFlag(flagged: boolean) {
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("transactionId", row.id);
    data.set("flagged", flagged ? "true" : "false");
    data.set("reason", reason);
    const result = await adminReviewTransactionAction(data);
    if (result.error) setError(result.error);
    else setFlagOpen(false);
    setPending(false);
  }

  return (
    <div className="flex min-w-40 flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        {categories ? (
          <TransactionEditForm
            row={row}
            categories={categories}
            permissions={permissions}
          />
        ) : null}
        {allowed("transactions.reverse") && live && row.origin !== "reversal" ? (
          <ActionButton
            action={adminReverseTransactionAction}
            fields={{ transactionId: row.id, label }}
            label="Reverse"
            confirmLabel="Confirm reverse"
            className="ad-btn"
            confirm
          />
        ) : null}
        {allowed("transactions.cancel") && live && clientOwned ? (
          <ActionButton
            action={adminCancelTransactionAction}
            fields={{ transactionId: row.id, label }}
            label="Cancel"
            confirmLabel="Confirm cancel"
            className="ad-btn ad-btn-danger"
            confirm
          />
        ) : null}
        {allowed("transactions.review") ? (
          row.flagged ? (
            <button
              type="button"
              className="ad-btn"
              disabled={pending}
              onClick={() => void setFlag(false)}
            >
              Clear flag
            </button>
          ) : (
            <button
              type="button"
              className="ad-btn"
              onClick={() => setFlagOpen((open) => !open)}
            >
              Flag
            </button>
          )
        ) : null}
      </div>
      {flagOpen ? (
        <div className="ad-card w-56 p-2 text-left">
          <input
            className="ad-input text-xs"
            placeholder="Why is this flagged?"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <button
            type="button"
            className="ad-btn ad-btn-primary mt-2 w-full"
            disabled={pending}
            onClick={() => void setFlag(true)}
          >
            Save flag
          </button>
        </div>
      ) : null}
      {error ? (
        <span className="text-xs" style={{ color: "var(--ad-bad)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
