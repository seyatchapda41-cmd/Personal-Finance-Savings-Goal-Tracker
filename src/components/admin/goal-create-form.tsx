"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSaveGoalAction } from "@/app/actions/admin";
import type { AdminClient } from "@/lib/admin/data";
import { todayIso } from "@/lib/format";

export function GoalCreateForm({ clients }: { clients: AdminClient[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await adminSaveGoalAction(formData);
        if (result.error) setError(result.error);
        else router.refresh();
        setPending(false);
      }}
    >
      <label className="block text-sm lg:col-span-2">
        Client
        <select className="ad-input mt-1" name="clientId" required defaultValue="">
          <option value="" disabled>
            Choose
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm lg:col-span-2">
        Title
        <input className="ad-input mt-1" name="title" required placeholder="Buy equipment" />
      </label>
      <label className="block text-sm">
        Target
        <input className="ad-input mt-1" name="targetAmount" type="number" min="1" step="0.01" required />
      </label>
      <label className="block text-sm">
        Already saved
        <input className="ad-input mt-1" name="currentAmount" type="number" min="0" step="0.01" defaultValue={0} />
      </label>
      <label className="block text-sm lg:col-span-2">
        Deadline
        <input className="ad-input mt-1" name="targetDate" type="date" required defaultValue={todayIso()} />
      </label>
      <div className="flex items-end lg:col-span-4">
        <button className="ad-btn ad-btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Create goal"}
        </button>
      </div>
      {error ? (
        <p className="text-sm lg:col-span-6" style={{ color: "var(--ad-bad)" }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
