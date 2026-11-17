"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/actions/auth";
import { VisibleField } from "@/components/visible-field";
import { clearSnapshot } from "@/lib/demo/storage";

export function DeleteAccount({
  userId,
  usingSupabase,
}: {
  userId: string;
  usingSupabase: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function remove() {
    if (confirmation.trim().toUpperCase() !== "DELETE") {
      setError("Type DELETE to confirm.");
      return;
    }
    setPending(true);
    setError(null);
    // Demo data lives in this browser, so it has to go from here.
    if (!usingSupabase) clearSnapshot(userId);
    const data = new FormData();
    data.set("confirm", confirmation);
    const result = await deleteAccountAction(data);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  if (!confirming) {
    return (
      <div>
        <button
          className="btn-danger"
          type="button"
          onClick={() => setConfirming(true)}
        >
          Delete account
        </button>
        <p className="mt-2 text-xs text-mute">
          Removes your login and every transaction, category and savings goal on
          it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        This deletes your account for good. Your transactions, categories and
        savings goals go with it and cannot be recovered.
      </p>
      <VisibleField
        label="Type DELETE to confirm"
        name="confirm"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete="off"
        placeholder="DELETE"
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="btn-danger"
          type="button"
          onClick={remove}
          disabled={pending}
        >
          {pending ? "Deleting…" : "Delete account permanently"}
        </button>
        <button
          className="btn-secondary"
          type="button"
          onClick={() => {
            setConfirming(false);
            setConfirmation("");
            setError(null);
          }}
          disabled={pending}
        >
          Keep my account
        </button>
      </div>
    </div>
  );
}
