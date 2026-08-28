"use client";

import { useState } from "react";
import {
  adminAdjustTransactionAction,
  adminEditTransactionAction,
} from "@/app/actions/admin";
import type { AdminCategory, AdminTransaction } from "@/lib/admin/data";
import type { Permission } from "@/lib/admin/rbac";
import { todayIso } from "@/lib/format";

export function AdjustmentForm({
  clientId,
  categories,
  permissions,
}: {
  clientId: string;
  categories: AdminCategory[];
  permissions: readonly Permission[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!permissions.includes("transactions.adjust")) return null;

  if (categories.length === 0) {
    return (
      <p className="ad-muted text-sm">
        This client has no categories yet, so a correction cannot be posted.
      </p>
    );
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      action={async (formData) => {
        setPending(true);
        setError(null);
        formData.set("clientId", clientId);
        const result = await adminAdjustTransactionAction(formData);
        if (result.error) setError(result.error);
        setPending(false);
      }}
    >
      <label className="block text-sm lg:col-span-2">
        Category
        <select className="ad-input mt-1" name="categoryId" required defaultValue="">
          <option value="" disabled>
            Choose
          </option>
          <optgroup label="Income">
            {categories
              .filter((c) => c.type === "income")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="Expense">
            {categories
              .filter((c) => c.type === "expense")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
        </select>
      </label>
      <label className="block text-sm">
        Amount
        <input
          className="ad-input mt-1"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
        />
      </label>
      <label className="block text-sm">
        Date
        <input
          className="ad-input mt-1"
          name="date"
          type="date"
          required
          defaultValue={todayIso()}
        />
      </label>
      <label className="block text-sm sm:col-span-2 lg:col-span-4">
        Detail
        <input
          className="ad-input mt-1"
          name="description"
          placeholder="Why this correction exists"
        />
      </label>
      <div className="flex items-end">
        <button className="ad-btn ad-btn-primary w-full" type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post correction"}
        </button>
      </div>
      {error ? (
        <p className="text-xs sm:col-span-2 lg:col-span-5" style={{ color: "var(--ad-bad)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function TransactionEditForm({
  row,
  categories,
  permissions,
}: {
  row: AdminTransaction;
  categories: AdminCategory[];
  permissions: readonly Permission[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (
    !permissions.includes("transactions.edit") ||
    row.origin !== "client" ||
    row.reversedById
  ) {
    return null;
  }

  if (!open) {
    return (
      <button type="button" className="ad-btn" onClick={() => setOpen(true)}>
        Edit
      </button>
    );
  }

  const own = categories.filter((c) => c.clientId === row.clientId);

  return (
    <form
      className="grid min-w-72 gap-2"
      action={async (formData) => {
        setPending(true);
        setError(null);
        formData.set("transactionId", row.id);
        const result = await adminEditTransactionAction(formData);
        if (result.error) setError(result.error);
        else setOpen(false);
        setPending(false);
      }}
    >
      <select className="ad-input" name="categoryId" defaultValue={row.categoryId} required>
        {own.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input
        className="ad-input"
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue={row.amount}
        required
      />
      <input className="ad-input" name="date" type="date" defaultValue={row.date} required />
      <input className="ad-input" name="description" defaultValue={row.description} />
      <div className="flex gap-2">
        <button className="ad-btn ad-btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button type="button" className="ad-btn" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      {error ? (
        <p className="text-xs" style={{ color: "var(--ad-bad)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
