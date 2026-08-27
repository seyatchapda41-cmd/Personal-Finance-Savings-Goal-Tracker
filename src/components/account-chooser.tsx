"use client";

import Link from "next/link";
import { useState } from "react";
import { forgetAccountAction } from "@/app/actions/auth";
import type { KnownAccount } from "@/lib/known-accounts";
import { normalizePlan, PLANS } from "@/lib/plans";

export function AccountChooser({
  accounts,
  children,
}: {
  accounts: KnownAccount[];
  children: React.ReactNode;
}) {
  const [creating, setCreating] = useState(accounts.length === 0);

  if (creating) {
    return (
      <div className="space-y-4">
        {children}
        {accounts.length > 0 ? (
          <p className="text-center text-sm text-mute">
            <button
              type="button"
              className="text-azure underline"
              onClick={() => setCreating(false)}
            >
              Use an account you already have
            </button>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-mute">
        These accounts were created on this device. Log into one of them, or
        start a brand new account.
      </p>
      <ul className="space-y-2">
        {accounts.map((account) => (
          <li
            key={account.phone}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4"
          >
            <Link
              href={`/login?phone=${encodeURIComponent(account.phone)}`}
              className="min-w-0"
            >
              <span className="block font-medium">{account.fullName}</span>
              <span className="block text-xs text-mute">
                {account.phone} · {PLANS[normalizePlan(account.plan)].label}
              </span>
            </Link>
            <form action={forgetAccountAction}>
              <input type="hidden" name="phone" value={account.phone} />
              <button type="submit" className="text-xs text-mute underline">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={() => setCreating(true)}
      >
        Create a new account
      </button>
    </div>
  );
}
