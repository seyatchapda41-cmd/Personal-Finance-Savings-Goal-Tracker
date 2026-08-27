"use client";

import { useState } from "react";
import { adminResetPasswordAction } from "@/app/actions/admin";

export function PasswordReset({ clientId }: { clientId: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("clientId", clientId);
    const result = await adminResetPasswordAction(data);
    if (result.error) setError(result.error);
    else if (result.password) setPassword(result.password);
    setPending(false);
  }

  if (password) {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <code className="rounded bg-white px-2 py-1 text-xs">{password}</code>
        <span className="text-xs text-mute">
          Pass this on, then it is gone from here.
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn-secondary text-xs"
        onClick={run}
        disabled={pending}
      >
        {pending ? "Working…" : "New password"}
      </button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </span>
  );
}
