"use client";

import { useState } from "react";
import { useFinance } from "@/lib/finance-context";

export default function CategoriesPage() {
  const { ready, snapshot, addCategory, updateCategory, deleteCategory } = useFinance();
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-1 text-sm text-mute">
          Split income and expenses so dashboard totals stay accurate.
        </p>
      </div>

      <form
        className="card flex flex-col gap-3 sm:flex-row"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const message = await addCategory(
            String(data.get("name")),
            String(data.get("type")) === "income" ? "income" : "expense",
          );
          setError(message);
          if (!message) form.reset();
        }}
      >
        <input className="input" name="name" placeholder="Category name" required />
        <select name="type" className="input sm:max-w-40">
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <button className="btn-primary" type="submit">
          Add
        </button>
      </form>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {(["income", "expense"] as const).map((type) => (
          <section key={type} className="card">
            <h2 className="font-semibold capitalize">{type}</h2>
            <ul className="mt-4 space-y-3">
              {snapshot.categories
                .filter((c) => c.type === type)
                .map((category) => (
                  <li key={category.id}>
                    <form
                      className="flex gap-2"
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const message = await updateCategory(
                          category.id,
                          String(data.get("name")),
                          type,
                        );
                        setError(message);
                      }}
                    >
                      <input className="input" name="name" defaultValue={category.name} />
                      <button className="btn-secondary" type="submit">
                        Save
                      </button>
                      <button
                        className="text-sm text-rose-600"
                        type="button"
                        onClick={async () => setError(await deleteCategory(category.id))}
                      >
                        Delete
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
