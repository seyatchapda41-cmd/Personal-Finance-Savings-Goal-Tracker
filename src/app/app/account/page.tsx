"use client";

import Link from "next/link";
import { useMemo } from "react";
import { signOutAction } from "@/app/actions/auth";
import { Stars } from "@/components/stars";
import { categoryById, signedAmount } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function AccountPage() {
  const { ready, snapshot, month, balance, limits, plan } = useFinance();

  const expenseByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of snapshot.transactions) {
      const signed = signedAmount(tx, snapshot.categories);
      if (signed >= 0) continue;
      const category = categoryById(snapshot.categories, tx.categoryId);
      if (!category) continue;
      totals.set(category.name, (totals.get(category.name) ?? 0) + -signed);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [snapshot.categories, snapshot.transactions]);

  if (!ready) return <p className="text-sm text-mute">Loading your account…</p>;

  const { profile } = snapshot;
  const savedTotal = snapshot.goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="card px-5 py-3 font-sans text-3xl font-semibold tracking-tight">
          {profile.fullName}
        </h1>
        <form action={signOutAction}>
          <button type="submit" className="btn-secondary">
            Sign out
          </button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Total income</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {formatMoney(balance.income)}
          </p>
          <p className="mt-1 text-xs text-mute">All recorded income</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Total expenditure</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">
            {formatMoney(balance.expense)}
          </p>
          <p className="mt-1 text-xs text-mute">All recorded expenses</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Balance</p>
          <p className="mt-2 text-3xl font-semibold">{formatMoney(balance.net)}</p>
          <p className="mt-1 text-xs text-mute">Income minus expenditure</p>
        </div>
      </section>

      <Link
        href="/app/premium"
        className="card flex items-center justify-between gap-4"
      >
        <span>
          <span className="block text-xs text-mute">Premium pass</span>
          <span className="mt-1 block text-lg font-semibold">
            {plan === "premium" ? "Active" : "Not active"}
          </span>
          <span className="mt-1 block text-xs text-mute">
            {plan === "premium"
              ? "Unlimited transactions, goals, categories and CSV export."
              : "See the conditions for a Premium pass and what it lifts."}
          </span>
        </span>
        <span className="text-sm whitespace-nowrap">View conditions</span>
      </Link>

      <section className="card">
        <h2 className="font-semibold">This month</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-mute">Income</p>
            <p className="mt-1 text-xl font-semibold">{formatMoney(month.income)}</p>
          </div>
          <div>
            <p className="text-xs text-mute">Expenditure</p>
            <p className="mt-1 text-xl font-semibold">{formatMoney(month.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-mute">Net</p>
            <p className="mt-1 text-xl font-semibold">{formatMoney(month.net)}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold">Where the money goes</h2>
          {expenseByCategory.length === 0 ? (
            <p className="mt-4 text-sm text-mute">
              No expenses recorded yet.{" "}
              <Link href="/app/transactions" className="text-azure">
                Add a transaction
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {expenseByCategory.map(([name, total]) => {
                const share =
                  balance.expense > 0 ? (total / balance.expense) * 100 : 0;
                return (
                  <li key={name}>
                    <div className="flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-mute">{formatMoney(total)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                      <div className="h-full bg-azure" style={{ width: `${share}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="font-semibold">Account summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-mute">Transactions recorded</dt>
              <dd>{snapshot.transactions.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Categories</dt>
              <dd>{snapshot.categories.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Savings goals</dt>
              <dd>{snapshot.goals.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Saved toward goals</dt>
              <dd>{formatMoney(savedTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Plan</dt>
              <dd>{limits.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-mute">Customer service</dt>
              <dd>
                <Link href="/app/support" className="text-azure">
                  <Stars value={limits.support.stars} />
                </Link>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app/transactions" className="btn-primary">
              Record a transaction
            </Link>
            <Link href="/app" className="btn-secondary">
              Open dashboard
            </Link>
          </div>
          <p className="mt-4 text-xs text-mute">
            <Link href="/app/settings#danger" className="text-azure">
              Delete account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
