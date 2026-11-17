"use client";

import Link from "next/link";
import { useState } from "react";
import {
  adminCreateFounderAction,
  adminSignInAction,
} from "@/app/actions/admin-auth";
import { BrandMark } from "@/components/logo";
import { Icons } from "@/components/admin/icons";
import { NightModeToggle, useNight } from "@/components/night-mode-toggle";
import { VisibleField } from "@/components/visible-field";
import { PASSWORD_HINT } from "@/lib/password";
import { PHONE_HINT } from "@/lib/phone";

export function AdminLoginForm({
  night: initialNight,
  needsFounder,
  clientSignedIn = false,
  blockedAsClient = false,
}: {
  night: boolean;
  needsFounder: boolean;
  clientSignedIn?: boolean;
  blockedAsClient?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(needsFounder);
  const night = useNight(initialNight);

  return (
    <div className={`admin ${night ? "dark" : ""} min-h-dvh`}>
      <div className="ad-shell flex min-h-dvh items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandMark size={40} />
              <span className="leading-tight">
                <span className="block font-semibold">Tempora</span>
                <span className="ad-muted block text-xs">Control panel</span>
              </span>
            </div>
            <NightModeToggle initialNight={initialNight} variant="admin" />
          </div>

          <div className="ad-card p-6">
            <h1 className="text-lg font-semibold">
              {creating ? "Create founder access" : "Staff sign in"}
            </h1>
            <p className="ad-muted mt-1 text-sm">
              {creating
                ? "No customers are required. This seat is yours: it opens the panel so you can run Tempora before anyone signs up."
                : "Only the founder can open this panel. Use the founder phone with country code, then the password for that account."}
            </p>

            {clientSignedIn || blockedAsClient ? (
              <p
                className="mt-4 rounded-lg p-3 text-xs"
                style={{
                  background: "var(--ad-warn-soft, #fff7ed)",
                  color: "var(--ad-warn, #9a3412)",
                }}
              >
                Sign in below with the founder phone. A customer login does not
                open this panel.
              </p>
            ) : null}

            <form
              className="mt-5 space-y-4"
              action={async (formData) => {
                setPending(true);
                setError(null);
                const result = creating
                  ? await adminCreateFounderAction(formData)
                  : await adminSignInAction(formData);
                if (result?.error) setError(result.error);
                setPending(false);
              }}
            >
              {creating ? (
                <VisibleField
                  tone="admin"
                  label="Your name"
                  name="fullName"
                  required
                  autoComplete="name"
                  autoFocus
                />
              ) : null}

              <VisibleField
                tone="admin"
                label="Phone number"
                name="phone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                autoFocus={!creating}
                hint={PHONE_HINT}
              />

              <VisibleField
                tone="admin"
                label="Password"
                name="password"
                type="password"
                required
                autoComplete={creating ? "new-password" : "current-password"}
                hint={creating ? PASSWORD_HINT : "Tap Show to read the password while you type."}
              />

              {error ? (
                <p
                  className="flex items-start gap-2 rounded-lg p-3 text-xs"
                  style={{
                    background: "var(--ad-bad-soft)",
                    color: "var(--ad-bad)",
                  }}
                >
                  <Icons.alert className="mt-px h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="ad-btn ad-btn-primary w-full"
                disabled={pending}
              >
                {pending
                  ? "Working…"
                  : creating
                    ? "Create founder and open panel"
                    : "Sign in to panel"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs">
              <Link href="/signup" style={{ color: "var(--ad-brand-text)" }}>
                Create an account
              </Link>
            </p>

            {needsFounder ? (
              <p className="mt-4 text-center text-xs">
                <button
                  type="button"
                  className="underline"
                  style={{ color: "var(--ad-brand-text)" }}
                  onClick={() => {
                    setCreating((value) => !value);
                    setError(null);
                  }}
                >
                  {creating
                    ? "I already have a staff password"
                    : "Create founder access instead"}
                </button>
              </p>
            ) : null}
          </div>

          <p className="ad-muted mt-6 text-center text-xs">
            The control panel exists whether or not any client has signed up.
          </p>
        </div>
      </div>
    </div>
  );
}
