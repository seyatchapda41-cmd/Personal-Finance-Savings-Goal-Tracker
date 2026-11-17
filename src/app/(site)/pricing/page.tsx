import type { Metadata } from "next";
import Link from "next/link";
import { Stars } from "@/components/stars";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing" };

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-3 max-w-xl leading-7 text-mute">
        Two account types. Standard covers everyday tracking. Premium removes the
        limits when you are running a full budget every month.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card">
          <p className="text-sm uppercase tracking-wide text-mute">
            {PLANS.free.label}
          </p>
          <p className="mt-2 text-4xl font-semibold">{PLANS.free.priceLabel}</p>
          <p className="mt-1 text-sm text-mute">Free forever</p>
          <ul className="mt-6 space-y-2 text-sm text-mute">
            {PLANS.free.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-medium">
              {PLANS.free.support.label} <Stars value={PLANS.free.support.stars} />
            </p>
            <p className="mt-1 text-xs text-mute">
              {PLANS.free.support.responseTime}. {PLANS.free.support.channels}.
            </p>
          </div>
          <Link href="/signup?plan=free" className="btn-secondary mt-8 inline-flex">
            Create standard account
          </Link>

          <div className="mt-6 rounded-lg bg-sand p-4">
            <p className="text-sm font-medium">Need Premium instead?</p>
            <p className="mt-1 text-xs text-mute">
              Pay before you sign up and your account starts on Premium. No need
              to open a Standard account first.
            </p>
            <Link
              href="/checkout"
              className="btn-primary mt-3 inline-flex text-sm"
            >
              Buy Premium — {PLANS.premium.priceLabel}/month
            </Link>
          </div>
        </div>

        <div className="card ring-2 ring-azure-strong">
          <p className="text-sm uppercase tracking-wide text-azure">
            {PLANS.premium.label}
          </p>
          <p className="mt-2 text-4xl font-semibold">
            {PLANS.premium.priceLabel}
            <span className="text-base font-normal text-mute">/month</span>
          </p>
          <p className="mt-1 text-sm text-mute">Cancel any time</p>
          <ul className="mt-6 space-y-2 text-sm text-mute">
            {PLANS.premium.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-medium">
              {PLANS.premium.support.label}{" "}
              <Stars value={PLANS.premium.support.stars} />
            </p>
            <p className="mt-1 text-xs text-mute">
              {PLANS.premium.support.responseTime}.{" "}
              {PLANS.premium.support.channels}.
            </p>
          </div>
          <Link href="/checkout" className="btn-primary mt-8 inline-flex">
            Buy Premium
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-mute">
        Checkout collects card details but no card network is connected yet, so
        no money moves and Premium is granted as soon as the form is accepted.
        Bank sync, multi-currency, and crypto remain out of scope for both tiers.
      </p>
    </div>
  );
}
