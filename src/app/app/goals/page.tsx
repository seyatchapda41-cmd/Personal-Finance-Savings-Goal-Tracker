"use client";

import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { VisibleField } from "@/components/visible-field";
import { goalProgress } from "@/lib/analytics";
import { formatMoney, todayIso } from "@/lib/format";
import { useFinance } from "@/lib/finance-context";

export default function GoalsPage() {
  const { ready, snapshot, addGoal, updateGoal, deleteGoal } = useFinance();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

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
          if (!message) {
            form.reset();
            setFormKey((key) => key + 1);
          }
        }}
      >
        <VisibleField
          key={`title-${formKey}`}
          className="sm:col-span-2"
          label="Title"
          name="title"
          required
          placeholder="Emergency fund"
        />
        <VisibleField
          key={`target-${formKey}`}
          label="Target amount (FCFA)"
          name="targetAmount"
          type="number"
          min={1}
          step={1}
          required
        />
        <VisibleField
          key={`saved-${formKey}`}
          label="Already saved (FCFA)"
          name="currentAmount"
          type="number"
          min={0}
          step={1}
          defaultValue={0}
        />
        <VisibleField
          key={`date-${formKey}`}
          className="sm:col-span-2"
          label="Target date"
          name="targetDate"
          type="date"
          required
          defaultValue={todayIso()}
        />
        <button className="btn-primary sm:col-span-2" type="submit">
          Create goal
        </button>
        {error ? (
          <div className="sm:col-span-2">
            <Notice tone="bad">{error}</Notice>
          </div>
        ) : null}
      </form>

      {snapshot.goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          body="Name a target in FCFA and a date you care about. Update what you have already saved as you go."
        />
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
                  <VisibleField
                    className="sm:col-span-2"
                    label="Title"
                    name="title"
                    defaultValue={goal.title}
                  />
                  <VisibleField
                    label="Already saved (FCFA)"
                    name="currentAmount"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={goal.currentAmount}
                  />
                  <VisibleField
                    label="Target amount (FCFA)"
                    name="targetAmount"
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={goal.targetAmount}
                  />
                  <VisibleField
                    className="sm:col-span-2"
                    label="Target date"
                    name="targetDate"
                    type="date"
                    defaultValue={goal.targetDate}
                  />
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
