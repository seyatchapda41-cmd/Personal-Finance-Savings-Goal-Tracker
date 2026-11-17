"use client";

import { useState } from "react";
import {
  adminDeleteClientAction,
  adminResetPasswordAction,
  adminSetPlanAction,
  adminSetSuspendedAction,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import type { Permission } from "@/lib/admin/rbac";

type Client = {
  id: string;
  phone: string;
  fullName: string;
  plan: string;
  suspended: boolean;
};

export function ClientActions({
  client,
  permissions,
}: {
  client: Client;
  permissions: readonly Permission[];
}) {
  const allowed = (permission: Permission) => permissions.includes(permission);
  const [open, setOpen] = useState<"suspend" | "password" | null>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function suspend() {
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("clientId", client.id);
    data.set("phone", client.phone);
    data.set("suspended", "true");
    data.set("reason", reason);
    const result = await adminSetSuspendedAction(data);
    if (result.error) setError(result.error);
    else setOpen(null);
    setPending(false);
  }

  async function newPassword() {
    setPending(true);
    setError(null);
    const data = new FormData();
    data.set("clientId", client.id);
    data.set("phone", client.phone);
    const result = await adminResetPasswordAction(data);
    if (result.error) setError(result.error);
    else if (result.password) setPassword(result.password);
    setPending(false);
  }

  if (password) {
    return (
      <div className="space-y-1">
        <span className="ad-kbd">{password}</span>
        <p className="ad-muted text-xs">Pass it on now; it is not stored.</p>
      </div>
    );
  }

  if (open === "suspend") {
    return (
      <div className="min-w-56 space-y-2">
        <input
          className="ad-input"
          placeholder="Reason (shown in the audit trail)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <div className="flex gap-1.5">
          <button
            type="button"
            className="ad-btn ad-btn-danger"
            onClick={suspend}
            disabled={pending}
          >
            {pending ? "Working…" : "Suspend account"}
          </button>
          <button
            type="button"
            className="ad-btn"
            onClick={() => {
              setOpen(null);
              setError(null);
            }}
            disabled={pending}
          >
            Cancel
          </button>
        </div>
        {error ? (
          <p className="text-xs" style={{ color: "var(--ad-bad)" }}>
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowed("clients.suspend") ? (
        client.suspended ? (
          <ActionButton
            action={adminSetSuspendedAction}
            fields={{
              clientId: client.id,
              phone: client.phone,
              suspended: "false",
            }}
            label="Restore"
          />
        ) : (
          <button
            type="button"
            className="ad-btn"
            onClick={() => setOpen("suspend")}
          >
            Suspend
          </button>
        )
      ) : null}

      {allowed("clients.plan") ? (
        <ActionButton
          action={adminSetPlanAction}
          fields={{
            clientId: client.id,
            phone: client.phone,
            plan: client.plan === "premium" ? "free" : "premium",
          }}
          label={client.plan === "premium" ? "To Standard" : "To Premium"}
        />
      ) : null}

      {allowed("clients.password") ? (
        <button
          type="button"
          className="ad-btn"
          onClick={newPassword}
          disabled={pending}
        >
          {pending ? "Working…" : "New password"}
        </button>
      ) : null}

      {allowed("clients.delete") ? (
        <ActionButton
          action={adminDeleteClientAction}
          fields={{ clientId: client.id, phone: client.phone }}
          label="Delete account"
          confirmLabel={`Delete ${client.fullName || client.phone} from the database?`}
          className="ad-btn ad-btn-danger"
          confirm
        />
      ) : null}

      {error ? (
        <span className="text-xs" style={{ color: "var(--ad-bad)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
