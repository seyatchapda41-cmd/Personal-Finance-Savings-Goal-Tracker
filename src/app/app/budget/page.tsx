"use client";

import { useEffect, useState } from "react";
import {
  readMonthlyBudgetAction,
  saveMonthlyBudgetAction,
} from "@/app/actions/budget";
import { expensesByCategoryName } from "@/lib/analytics";
import { currentMonthKey, formatMoney } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";
import { isSupabaseConfigured } from "@/lib/config";
import { VisibleField } from "@/components/visible-field";

function localKey(userId: string, month: string) {
  return `tempora.budget.${userId}.${month}`;
}

export default function BudgetPage() {
  const { ready, snapshot, month: monthTotals } = useFinance();
  const month = currentMonthKey();
  const [limit, setLimit] = useState(0);
  const [draft, setDraft] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    async function load() {
      if (isSupabaseConfigured()) {
        const value = await readMonthlyBudgetAction(month);
        if (!cancelled) {
          setLimit(value);
          setDraft(String(value || 0));
          setLoaded(true);
        }
        return;
      }
      const raw = window.localStorage.getItem(
        localKey(snapshot.profile.id, month),
      );
      const value = raw ? Number(raw) : 0;
      if (!cancelled) {
        setLimit(Number.isFinite(value) ? value : 0);
        setDraft(String(Number.isFinite(value) ? value : 0));
        setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [ready, month, snapshot.profile.id]);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  const spent = monthTotals.expense;
  const remaining = limit - spent;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const slices = expensesByCategoryName(
    snapshot.transactions,
    snapshot.categories,
    month,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Budget</h1>
        <p className="mt-1 text-sm text-mute">
          Set a spending cap for this month and compare it with what you have
          already spent.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Planned</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(limit)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Spent</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(spent)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Left</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(remaining)}</p>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between text-sm">
          <span>Progress this month</span>
          <span className="text-mute">{Math.round(pct)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-sand">
          <div
            className={`h-full ${pct >= 100 ? "bg-rose-600" : "bg-azure"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {limit > 0 && spent > limit ? (
          <p className="text-sm text-rose-600">
            You are over this month&apos;s budget.
          </p>
        ) : null}
      </div>

      <form
        className="card space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(null);
          const amount = Number(draft);
          if (isSupabaseConfigured()) {
            const data = new FormData();
            data.set("month", month);
            data.set("expenseLimit", String(amount));
            const result = await saveMonthlyBudgetAction(data);
            if (result.error) {
              setError(result.error);
              setPending(false);
              return;
            }
          } else {
            window.localStorage.setItem(
              localKey(snapshot.profile.id, month),
              String(amount),
            );
          }
          setLimit(amount);
          setPending(false);
        }}
      >
        <VisibleField
          label={`Monthly spending cap in FCFA (${month})`}
          name="expenseLimit"
          type="number"
          min={0}
          step={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!loaded}
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save budget"}
        </button>
      </form>

      <section className="card">
        <h2 className="font-semibold">Spending by category</h2>
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
