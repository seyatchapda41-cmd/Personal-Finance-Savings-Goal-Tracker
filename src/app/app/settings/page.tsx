"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePlanAction, signOutAction } from "@/app/actions/auth";
import { DeleteAccount } from "@/components/delete-account";
import { VisibleField } from "@/components/visible-field";
import { NightModeToggle } from "@/components/night-mode-toggle";
import { PLANS } from "@/lib/plans";
import { useFinance } from "@/lib/finance-context";

export default function SettingsPage() {
  const {
    ready,
    snapshot,
    usingSupabase,
    plan,
    limits,
    monthlyTransactionCount,
    updateProfileName,
  } = useFinance();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planPending, setPlanPending] = useState(false);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  const isPremium = plan === "premium";

  async function downgrade() {
    setPlanPending(true);
    setPlanError(null);
    const data = new FormData();
    data.set("plan", "free");
    const result = await changePlanAction(data);
    if (result.error) setPlanError(result.error);
    else router.refresh();
    setPlanPending(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-mute">
          {usingSupabase
            ? "Connected to Supabase Auth and Postgres."
            : "Running in local demo mode. Connect Supabase for production."}
        </p>
      </div>

      <section className="card space-y-3">
        <div>
          <p className="text-xs text-mute">Look and feel</p>
          <h2 className="mt-1 font-semibold">Theme, text style and night mode</h2>
          <p className="mt-1 text-sm text-mute">
            Colours and typeface are saved on this device. Night mode uses a
            light (white) typeface colour and will change the current colour
            background — you will be asked before it turns on.
          </p>
        </div>
        <NightModeToggle initialNight={false} />
        <Link href="/app/appearance" className="btn-secondary inline-flex">
          Choose appearance
        </Link>
      </section>

      <section className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-mute">Account type</p>
            <p className="mt-1 text-lg font-semibold">{limits.label}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isPremium
                ? "bg-azure-strong text-white"
                : "border border-line text-mute"
            }`}
          >
            {isPremium ? "Premium" : "Standard"}
          </span>
        </div>

        <ul className="space-y-1 text-sm text-mute">
          <li>
            Transactions this month: {monthlyTransactionCount}
            {limits.monthlyTransactions === null
              ? " (unlimited)"
              : ` of ${limits.monthlyTransactions}`}
          </li>
          <li>
            Savings goals: {snapshot.goals.length}
            {limits.goals === null ? " (unlimited)" : ` of ${limits.goals}`}
          </li>
          <li>
            Categories: {snapshot.categories.length}
            {limits.categories === null
              ? " (unlimited)"
              : ` of ${limits.categories}`}
          </li>
          <li>CSV export: {limits.csvExport ? "included" : "premium only"}</li>
        </ul>

        {isPremium ? (
          <button
            className="btn-secondary"
            type="button"
            onClick={downgrade}
            disabled={planPending}
          >
            {planPending ? "Updating…" : "Switch to Standard"}
          </button>
        ) : (
          <Link href="/checkout" className="btn-primary">
            Buy Premium ({PLANS.premium.priceLabel}/month)
          </Link>
        )}
        {planError ? <p className="text-sm text-rose-600">{planError}</p> : null}
      </section>

      <form
        className="card space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          await updateProfileName(String(data.get("fullName")));
          setSaved(true);
        }}
      >
        <VisibleField
          label="Full name"
          name="fullName"
          defaultValue={snapshot.profile.fullName}
        />
        <VisibleField
          label="Phone number (login)"
          name="phone"
          value={snapshot.profile.phone}
          disabled
        />
        <VisibleField
          label="Email"
          name="email"
          value={snapshot.profile.email}
          disabled
        />
        <button className="btn-primary" type="submit">
          Save profile
        </button>
        {saved ? <p className="text-sm text-azure">Saved.</p> : null}
      </form>

      <form action={signOutAction}>
        <button className="btn-secondary" type="submit">
          Sign out
        </button>
      </form>

      <section id="danger" className="card space-y-4">
        <div>
          <h2 className="font-semibold">Delete this account</h2>
          <p className="mt-1 text-sm text-mute">
            Closing the account for {snapshot.profile.fullName} (
            {snapshot.profile.phone}) cannot be undone.
          </p>
        </div>
        <DeleteAccount
          userId={snapshot.profile.id}
          usingSupabase={usingSupabase}
        />
      </section>
    </div>
  );
}
