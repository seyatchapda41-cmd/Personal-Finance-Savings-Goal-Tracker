"use client";

import Link from "next/link";
import { useState } from "react";
import {
  adminCreateFounderAction,
  adminSignInAction,
} from "@/app/actions/admin-auth";
import { Icons } from "@/components/admin/icons";
import { PASSWORD_HINT } from "@/lib/password";
import { PHONE_HINT } from "@/lib/phone";

export function AdminLoginForm({
  theme,
  needsFounder,
}: {
  theme: "light" | "dark";
  needsFounder: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [creating, setCreating] = useState(needsFounder);

  return (
    <div className={`admin ${theme === "dark" ? "dark" : ""} min-h-dvh`}>
      <div className="ad-shell flex min-h-dvh items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-base font-bold text-white"
              style={{ background: "var(--ad-brand)" }}
            >
              T
            </span>
            <span className="leading-tight">
              <span className="block font-semibold">Tempora</span>
              <span className="ad-muted block text-xs">Control panel</span>
            </span>
          </div>

          <div className="ad-card p-6">
            <h1 className="text-lg font-semibold">
              {creating ? "Create founder access" : "Staff sign in"}
            </h1>
            <p className="ad-muted mt-1 text-sm">
              {creating
                ? "No customers are required. This seat is yours: it opens the panel so you can run Tempora before anyone signs up."
                : "Only the founder can open this panel. Client accounts sign in on the main site."}
            </p>

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
                <label className="block text-sm">
                  Your name
                  <input
                    className="ad-input mt-1"
                    name="fullName"
                    required
                    autoComplete="name"
                    autoFocus
                  />
                </label>
              ) : null}

              <label className="block text-sm">
                Phone number
                <input
                  className="ad-input mt-1"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  autoFocus={!creating}
                />
                <span className="ad-muted mt-1 block text-xs">{PHONE_HINT}</span>
              </label>

              <label className="block text-sm">
                Password
                <input
                  className="ad-input mt-1"
                  name="password"
                  type="password"
                  required
                  autoComplete={creating ? "new-password" : "current-password"}
                />
                {creating ? (
                  <span className="ad-muted mt-1 block text-xs">{PASSWORD_HINT}</span>
                ) : null}
              </label>

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
          <p className="mt-2 text-center text-xs">
            <Link href="/" style={{ color: "var(--ad-brand-text)" }}>
              Back to the main site
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
