"use client";

import Link from "next/link";
import { categoryById, goalProgress } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function DashboardPage() {
  const { ready, snapshot, month, balance } = useFinance();

  if (!ready) return <p className="text-sm text-mute">Loading your books…</p>;

  const recent = [...snapshot.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-mute">
          Hello {snapshot.profile.fullName}. Here is this month and your goals.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Balance (all time)</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(balance.net)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Income this month</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(month.income)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Expenses this month</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(month.expense)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent transactions</h2>
            <Link href="/app/transactions" className="text-sm text-azure">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-mute">
              No transactions yet.{" "}
              <Link href="/app/transactions" className="text-azure">
                Add the first one
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((tx) => {
                const category = categoryById(snapshot.categories, tx.categoryId);
                const expense = category?.type === "expense";
                return (
                  <li key={tx.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{tx.description || category?.name}</p>
                      <p className="text-xs text-mute">
                        {tx.date} · {category?.name}
                      </p>
                    </div>
                    <span className={expense ? "text-rose-600" : "text-emerald-600"}>
                      {expense ? "-" : "+"}
                      {formatMoney(tx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Savings goals</h2>
            <Link href="/app/goals" className="text-sm text-azure">
              Manage
            </Link>
          </div>
          {snapshot.goals.length === 0 ? (
            <p className="mt-4 text-sm text-mute">
              No goals yet.{" "}
              <Link href="/app/goals" className="text-azure">
                Create a target
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {snapshot.goals.slice(0, 4).map((goal) => {
                const pct = goalProgress(goal);
                return (
                  <li key={goal.id}>
                    <div className="flex justify-between text-sm">
                      <span>{goal.title}</span>
                      <span className="text-mute">{Math.round(pct)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className="h-full bg-azure"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
