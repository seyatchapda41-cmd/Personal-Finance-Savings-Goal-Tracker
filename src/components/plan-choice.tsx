"use client";

import Link from "next/link";
import { useState } from "react";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/types";

export function PlanChoice({
  initialPlan = "free",
  paidReceipt,
}: {
  initialPlan?: Plan;
  paidReceipt?: { ref: string; cardLast4: string } | null;
}) {
  const [selected, setSelected] = useState<Plan>(
    paidReceipt ? "premium" : initialPlan,
  );

  // Premium is already paid for, so the choice is settled.
  if (paidReceipt) {
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm">Account type</legend>
        <input type="hidden" name="plan" value="premium" />
        <div className="rounded-lg border border-azure bg-azure-soft p-4">
          <p className="flex items-baseline justify-between">
            <span className="font-medium">{PLANS.premium.label} — paid</span>
            <span className="text-sm text-mute">
              {PLANS.premium.priceLabel}/month
            </span>
          </p>
          <p className="mt-1 text-xs text-mute">
            Receipt {paidReceipt.ref} · card ending {paidReceipt.cardLast4}. This
            account will be created on Premium.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-mute">
            {PLANS.premium.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm">Account type</legend>
      <input type="hidden" name="plan" value={selected} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelected("free")}
          aria-pressed={selected === "free"}
          className={`rounded-lg border p-4 text-left transition-colors ${
            selected === "free"
              ? "border-azure-strong bg-azure-soft"
              : "border-line bg-panel hover:border-azure"
          }`}
        >
          <span className="flex items-baseline justify-between">
            <span className="font-medium">{PLANS.free.label}</span>
            <span className="text-sm text-mute">{PLANS.free.priceLabel}</span>
          </span>
          <span className="mt-2 block text-xs text-mute">
            {PLANS.free.blurb}
          </span>
        </button>

        <Link
          href="/checkout"
          className="rounded-lg border border-line bg-panel p-4 text-left transition-colors hover:border-azure"
        >
          <span className="flex items-baseline justify-between">
            <span className="font-medium">{PLANS.premium.label}</span>
            <span className="text-sm text-mute">
              {PLANS.premium.priceLabel}/month
            </span>
          </span>
          <span className="mt-2 block text-xs text-mute">
            {PLANS.premium.blurb} Pay first to pick this.
          </span>
        </Link>
      </div>
      <ul className="space-y-1 text-xs text-mute">
        {PLANS.free.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <div className="rounded-lg border border-azure bg-azure-soft p-4">
        <p className="text-sm font-medium">Need Premium before you start?</p>
        <p className="mt-1 text-xs text-mute">
          Standard stops at {PLANS.free.monthlyTransactions} transactions a month
          and {PLANS.free.goals} savings goals. Pay for Premium and you come
          straight back here to finish signing up.
        </p>
        <Link href="/checkout" className="btn-primary mt-3 inline-flex text-sm">
          Buy Premium — {PLANS.premium.priceLabel}/month
        </Link>
      </div>
    </fieldset>
  );
}
