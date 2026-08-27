"use client";

import { useState } from "react";

type ActionResult = { error?: string; ok?: true };

// One button that runs a founder action, asking twice when the action is
// destructive.
export function ActionButton({
  action,
  fields,
  label,
  confirmLabel,
  className = "btn-secondary",
  confirm = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  label: string;
  confirmLabel?: string;
  className?: string;
  confirm?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirm && !armed) {
      setArmed(true);
      return;
    }
    setPending(true);
    setError(null);
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.set(key, value);
    const result = await action(data);
    if (result?.error) setError(result.error);
    setPending(false);
    setArmed(false);
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-2">
        <button
          type="button"
          className={`${className} text-xs`}
          onClick={run}
          disabled={pending}
        >
          {pending
            ? "Working…"
            : armed
              ? (confirmLabel ?? `Confirm ${label.toLowerCase()}`)
              : label}
        </button>
        {armed ? (
          <button
            type="button"
            className="text-xs underline"
            onClick={() => setArmed(false)}
            disabled={pending}
          >
            Cancel
          </button>
        ) : null}
      </span>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </span>
  );
}
