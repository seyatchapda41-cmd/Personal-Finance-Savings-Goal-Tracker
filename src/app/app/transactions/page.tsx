"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryById, signedAmount } from "@/lib/analytics";
import { formatMoney, todayIso } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function TransactionsPage() {
  const {
    ready,
    snapshot,
    limits,
    monthlyTransactionCount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinance();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const incomeCats = snapshot.categories.filter((c) => c.type === "income");
  const expenseCats = snapshot.categories.filter((c) => c.type === "expense");

  const rows = useMemo(() => {
    return [...snapshot.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((tx) => {
        if (filter === "all") return true;
        return categoryById(snapshot.categories, tx.categoryId)?.type === filter;
      });
  }, [filter, snapshot.categories, snapshot.transactions]);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  function exportCsv() {
    const header = "date,category,type,description,amount";
    const lines = rows.map((tx) => {
      const category = categoryById(snapshot.categories, tx.categoryId);
      const description = tx.description.replaceAll('"', '""');
      return `${tx.date},"${category?.name ?? ""}",${category?.type ?? ""},"${description}",${tx.amount}`;
    });
    const blob = new Blob([[header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tempora-transactions-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-mute">
            New entries are saved immediately and included in dashboard totals.
            {limits.monthlyTransactions === null
              ? ""
              : ` ${monthlyTransactionCount} of ${limits.monthlyTransactions} used this month.`}
          </p>
        </div>
        {limits.csvExport ? (
          <button className="btn-secondary" type="button" onClick={exportCsv}>
            Export CSV
          </button>
        ) : (
          <Link href="/app/settings" className="text-sm text-azure">
            CSV export is Premium
          </Link>
        )}
      </div>

      <form
        className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const message = await addTransaction({
            categoryId: String(data.get("categoryId")),
            amount: Number(data.get("amount")),
            date: String(data.get("date")),
            description: String(data.get("description")),
          });
          setError(message);
          if (!message) form.reset();
        }}
      >
        <label className="text-sm lg:col-span-2">
          Category
          <select name="categoryId" className="input mt-1" required defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            <optgroup label="Income">
              {incomeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Expense">
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="text-sm">
          Amount
          <input className="input mt-1" name="amount" type="number" min="0.01" step="0.01" required />
        </label>
        <label className="text-sm">
          Date
          <input className="input mt-1" name="date" type="date" required defaultValue={todayIso()} />
        </label>
        <label className="text-sm sm:col-span-2 lg:col-span-4">
          Description
          <input className="input mt-1" name="description" placeholder="Optional note" />
        </label>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">
            Add
          </button>
        </div>
        {error ? <p className="text-sm text-rose-600 sm:col-span-2 lg:col-span-5">{error}</p> : null}
      </form>

      <div className="flex gap-2">
        {(["all", "income", "expense"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === key
                ? "bg-azure-strong text-white"
                : "border border-line bg-white text-ink"
            }`}
            onClick={() => setFilter(key)}
          >
            {key}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-mute">No transactions in this view.</p>
      ) : (
        <div className="on-blue overflow-x-auto rounded-xl border border-line bg-panel">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-mute">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const category = categoryById(snapshot.categories, tx.categoryId);
                const signed = signedAmount(tx, snapshot.categories);
                const locked = tx.origin !== "client";
                const originLabel =
                  tx.origin === "admin"
                    ? "Staff correction"
                    : tx.origin === "reversal"
                      ? "Reversal"
                      : null;
                if (editing === tx.id && !locked) {
                  return (
                    <tr key={tx.id} className="border-b border-line">
                      <td colSpan={5} className="px-4 py-3">
                        <form
                          className="grid gap-2 md:grid-cols-5"
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const data = new FormData(event.currentTarget);
                            const message = await updateTransaction(tx.id, {
                              categoryId: String(data.get("categoryId")),
                              amount: Number(data.get("amount")),
                              date: String(data.get("date")),
                              description: String(data.get("description")),
                            });
                            if (!message) setEditing(null);
                            else setError(message);
                          }}
                        >
                          <select name="categoryId" className="input" defaultValue={tx.categoryId}>
                            {snapshot.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            defaultValue={tx.amount}
                          />
                          <input className="input" name="date" type="date" defaultValue={tx.date} />
                          <input className="input" name="description" defaultValue={tx.description} />
                          <div className="flex gap-2">
                            <button className="btn-primary" type="submit">
                              Save
                            </button>
                            <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={tx.id} className="border-b border-line">
                    <td className="px-4 py-3">{tx.date}</td>
                    <td className="px-4 py-3">{category?.name}</td>
                    <td className="px-4 py-3">
                      {tx.description || "—"}
                      {originLabel ? (
                        <span className="mt-0.5 block text-xs text-mute">{originLabel}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {signed < 0 ? "-" : "+"}
                      {formatMoney(Math.abs(signed))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {locked ? (
                        <span className="text-xs text-mute">Locked by staff</span>
                      ) : (
                        <>
                          <button className="text-azure" type="button" onClick={() => setEditing(tx.id)}>
                            Edit
                          </button>
                          {" · "}
                          <button
                            className="text-rose-600"
                            type="button"
                            onClick={() => void deleteTransaction(tx.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
