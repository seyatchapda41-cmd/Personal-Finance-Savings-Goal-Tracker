"use client";

import Link from "next/link";
import { useState } from "react";
import { adminRegisterAccountAction } from "@/app/actions/admin-auth";
import { BrandMark } from "@/components/logo";
import { Icons } from "@/components/admin/icons";
import { NightModeToggle, useNight } from "@/components/night-mode-toggle";
import { VisibleField } from "@/components/visible-field";
import { PASSWORD_HINT } from "@/lib/password";
import { PHONE_HINT } from "@/lib/phone";

export function AdminSignupForm({
  night: initialNight,
}: {
  night: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
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
            <h1 className="text-lg font-semibold">Create an account</h1>
            <p className="ad-muted mt-1 text-sm">
              The phone and password are saved in the database. The same login
              then works on this device and on any other.
            </p>

            {done ? (
              <p className="mt-5 text-sm">
                The account is saved. Sign in with that phone and password on
                any device.
              </p>
            ) : (
              <form
                className="mt-5 space-y-4"
                action={async (formData) => {
                  setPending(true);
                  setError(null);
                  const result = await adminRegisterAccountAction(formData);
                  if (result?.error) setError(result.error);
                  if (result?.ok) setDone(true);
                  setPending(false);
                }}
              >
                <VisibleField tone="admin" label="Full name" name="fullName" required autoComplete="name" />
                <VisibleField tone="admin" label="Email" name="email" type="email" required autoComplete="email" />
                <VisibleField
                  tone="admin"
                  label="Phone number"
                  name="phone"
                  type="tel"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  hint={PHONE_HINT}
                />
                <VisibleField
                  tone="admin"
                  label="Password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  hint={PASSWORD_HINT}
                />
                {error ? (
                  <p
                    className="flex items-start gap-2 rounded-lg p-3 text-xs"
                    style={{ background: "var(--ad-bad-soft)", color: "var(--ad-bad)" }}
                  >
                    <Icons.alert className="mt-px h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                ) : null}
                <button type="submit" className="ad-btn ad-btn-primary w-full" disabled={pending}>
                  {pending ? "Saving…" : "Create account"}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs">
            <Link href="/login" style={{ color: "var(--ad-brand-text)" }}>
              Back to staff sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
