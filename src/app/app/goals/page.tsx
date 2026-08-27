"use client";

import { useState } from "react";
import { goalProgress } from "@/lib/analytics";
import { formatMoney, todayIso } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function GoalsPage() {
  const { ready, snapshot, addGoal, updateGoal, deleteGoal } = useFinance();
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Savings goals</h1>
        <p className="mt-1 text-sm text-mute">
          Set a target, a date, and how much you have already saved.
        </p>
      </div>

      <form
        className="card grid gap-3 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const message = await addGoal({
            title: String(data.get("title")),
            targetAmount: Number(data.get("targetAmount")),
            currentAmount: Number(data.get("currentAmount") || 0),
            targetDate: String(data.get("targetDate")),
          });
          setError(message);
          if (!message) form.reset();
        }}
      >
        <label className="text-sm sm:col-span-2">
          Title
          <input className="input mt-1" name="title" required placeholder="Emergency fund" />
        </label>
        <label className="text-sm">
          Target amount
          <input className="input mt-1" name="targetAmount" type="number" min="1" step="0.01" required />
        </label>
        <label className="text-sm">
          Already saved
          <input className="input mt-1" name="currentAmount" type="number" min="0" step="0.01" defaultValue={0} />
        </label>
        <label className="text-sm sm:col-span-2">
          Target date
          <input className="input mt-1" name="targetDate" type="date" required defaultValue={todayIso()} />
        </label>
        <button className="btn-primary sm:col-span-2" type="submit">
          Create goal
        </button>
        {error ? <p className="text-sm text-rose-600 sm:col-span-2">{error}</p> : null}
      </form>

      {snapshot.goals.length === 0 ? (
        <p className="text-sm text-mute">No savings goals yet.</p>
      ) : (
        <ul className="space-y-4">
          {snapshot.goals.map((goal) => {
            const pct = goalProgress(goal);
            return (
              <li key={goal.id} className="card space-y-4">
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const message = await updateGoal(goal.id, {
                      title: String(data.get("title")),
                      targetAmount: Number(data.get("targetAmount")),
                      currentAmount: Number(data.get("currentAmount")),
                      targetDate: String(data.get("targetDate")),
                    });
                    setError(message);
                  }}
                >
                  <input className="input sm:col-span-2" name="title" defaultValue={goal.title} />
                  <input
                    className="input"
                    name="currentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={goal.currentAmount}
                  />
                  <input
                    className="input"
                    name="targetAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    defaultValue={goal.targetAmount}
                  />
                  <input className="input sm:col-span-2" name="targetDate" type="date" defaultValue={goal.targetDate} />
                  <div className="flex items-center justify-between sm:col-span-2">
                    <p className="text-sm text-mute">
                      {formatMoney(goal.currentAmount)} of {formatMoney(goal.targetAmount)} · due{" "}
                      {goal.targetDate}
                    </p>
                    <div className="flex gap-3">
                      <button className="btn-primary" type="submit">
                        Save
                      </button>
                      <button className="text-sm text-rose-600" type="button" onClick={() => void deleteGoal(goal.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </form>
                <div className="h-2 overflow-hidden rounded-full bg-sand">
                  <div className="h-full bg-azure" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
