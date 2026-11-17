"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { VisibleField } from "@/components/visible-field";
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
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [formKey, setFormKey] = useState(0);

  const incomeCats = snapshot.categories.filter((c) => c.type === "income");
  const expenseCats = snapshot.categories.filter((c) => c.type === "expense");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...snapshot.transactions]
      .filter((tx) => {
        if (filter !== "all") {
          if (categoryById(snapshot.categories, tx.categoryId)?.type !== filter) {
            return false;
          }
        }
        if (!needle) return true;
        const category = categoryById(snapshot.categories, tx.categoryId);
        return (
          tx.description.toLowerCase().includes(needle) ||
          (category?.name ?? "").toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        if (sort === "amount") return b.amount - a.amount;
        return b.date.localeCompare(a.date);
      });
  }, [filter, query, sort, snapshot.categories, snapshot.transactions]);

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
          if (!message) {
            form.reset();
            setFormKey((key) => key + 1);
            setNotice("Transaction saved.");
          } else {
            setNotice(null);
          }
        }}
      >
        <VisibleField
          key={`category-${formKey}`}
          className="lg:col-span-2"
          label="Category"
          name="categoryId"
          as="select"
          required
          defaultValue=""
        >
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
        </VisibleField>
        <VisibleField
          key={`amount-${formKey}`}
          label="Amount (FCFA)"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
        />
        <VisibleField
          key={`date-${formKey}`}
          label="Date"
          name="date"
          type="date"
          required
          defaultValue={todayIso()}
        />
        <VisibleField
          key={`description-${formKey}`}
          className="sm:col-span-2 lg:col-span-4"
          label="Description"
          name="description"
          placeholder="Optional note"
        />
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">
            Add
          </button>
        </div>
        {error ? (
          <div className="sm:col-span-2 lg:col-span-5">
            <Notice tone="bad">{error}</Notice>
          </div>
        ) : null}
        {notice ? (
          <div className="sm:col-span-2 lg:col-span-5">
            <Notice>{notice}</Notice>
          </div>
        ) : null}
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm ${
                filter === key
                  ? "bg-azure-strong text-white"
                  : "border border-line bg-panel text-ink"
              }`}
              onClick={() => setFilter(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <VisibleField
          className="sm:max-w-xs"
          label="Search"
          name="query"
          type="search"
          placeholder="Search description or category"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <VisibleField
          className="sm:w-auto"
          label="Sort"
          name="sort"
          as="select"
          value={sort}
          onChange={(event) =>
            setSort(event.target.value === "amount" ? "amount" : "date")
          }
        >
          <option value="date">Newest date</option>
          <option value="amount">Largest amount</option>
        </VisibleField>
      </div>

      {snapshot.transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          body="Log the first income or expense. Dashboard totals will follow immediately."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nothing in this view"
          body="Try another filter, or clear the search to see everything again."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-panel">
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
                          <VisibleField
                            label="Category"
                            name="categoryId"
                            as="select"
                            defaultValue={tx.categoryId}
                          >
                            {snapshot.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </VisibleField>
                          <VisibleField
                            label="Amount (FCFA)"
                            name="amount"
                            type="number"
                            min={1}
                            step={1}
                            defaultValue={tx.amount}
                          />
                          <VisibleField
                            label="Date"
                            name="date"
                            type="date"
                            defaultValue={tx.date}
                          />
                          <VisibleField
                            label="Description"
                            name="description"
                            defaultValue={tx.description}
                          />
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
