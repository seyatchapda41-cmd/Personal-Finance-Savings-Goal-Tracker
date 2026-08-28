"use client";

import { expensesByCategoryName, monthlyHistory } from "@/lib/analytics";
import { currentMonthKey, formatMoney } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function StatisticsPage() {
  const { ready, snapshot, month, balance } = useFinance();
  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  const series = monthlyHistory(snapshot.transactions, snapshot.categories, 12);
  const slices = expensesByCategoryName(
    snapshot.transactions,
    snapshot.categories,
    currentMonthKey(),
  );
  const max = Math.max(1, ...series.flatMap((point) => [point.income, point.expense]));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="mt-1 text-sm text-mute">
          How income and spending move month by month, and where this month
          went.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(balance.net)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Income this month</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(month.income)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Profit this month</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatMoney(month.income - month.expense)}
          </p>
        </div>
      </div>

      <section className="card">
        <h2 className="font-semibold">Last 12 months</h2>
        <div className="mt-6 flex h-48 items-end gap-2">
          {series.map((point) => (
            <div key={point.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-0.5">
                <div
                  className="w-[45%] rounded-t bg-emerald-500"
                  style={{
                    height: `${(point.income / max) * 100}%`,
                    minHeight: point.income > 0 ? 4 : 0,
                  }}
                />
                <div
                  className="w-[45%] rounded-t bg-rose-500"
                  style={{
                    height: `${(point.expense / max) * 100}%`,
                    minHeight: point.expense > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] text-mute">
                {point.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-mute">Green is income. Red is expenses.</p>
      </section>

      <section className="card">
        <h2 className="font-semibold">This month by category</h2>
        {slices.length === 0 ? (
          <p className="mt-3 text-sm text-mute">No expenses this month yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {slices.map((slice) => (
              <li key={slice.name}>
                <div className="flex justify-between text-sm">
                  <span>{slice.name}</span>
                  <span className="text-mute">
                    {formatMoney(slice.amount)} · {Math.round(slice.share)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full bg-azure"
                    style={{ width: `${Math.max(4, slice.share)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
