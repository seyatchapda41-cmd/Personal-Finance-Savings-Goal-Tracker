"use client";

import { useState } from "react";
import { VisibleField } from "@/components/visible-field";
import { useFinance } from "@/lib/finance-context";

export default function CategoriesPage() {
  const { ready, snapshot, addCategory, updateCategory, deleteCategory } = useFinance();
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

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
          if (!message) {
            form.reset();
            setFormKey((key) => key + 1);
          }
        }}
      >
        <VisibleField
          key={`name-${formKey}`}
          className="flex-1"
          label="Category name"
          name="name"
          required
          placeholder="Category name"
        />
        <VisibleField
          key={`type-${formKey}`}
          className="sm:max-w-44"
          label="Type"
          name="type"
          as="select"
          defaultValue="expense"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </VisibleField>
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
                      <VisibleField
                        className="flex-1"
                        label="Category name"
                        name="name"
                        defaultValue={category.name}
                      />
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
