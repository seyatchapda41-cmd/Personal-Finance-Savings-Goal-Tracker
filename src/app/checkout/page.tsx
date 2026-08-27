import type { Metadata } from "next";
import Link from "next/link";
import { payPremiumAction } from "@/app/actions/billing";
import { CheckoutForm } from "@/components/checkout-form";
import { Logo } from "@/components/logo";
import { getCurrentProfile } from "@/lib/auth/profile";
import { readPremiumReceipt } from "@/lib/billing-server";
import { PLANS } from "@/lib/plans";

export const metadata: Metadata = { title: "Buy Premium" };

export default async function CheckoutPage() {
  const [receipt, profile] = await Promise.all([
    readPremiumReceipt(),
    getCurrentProfile(),
  ]);
  const premium = PLANS.premium;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">Buy Premium</h1>
      <p className="mt-2 text-sm text-mute">
        {profile
          ? `Paying now moves ${profile.fullName} onto Premium straight away.`
          : "Pay first, then create your account. It will be created on Premium, so you never start on Standard."}
      </p>

      <div className="card mt-8">
        <div className="flex items-baseline justify-between">
          <p className="text-sm uppercase tracking-wide">{premium.label}</p>
          <p className="text-2xl font-semibold">
            {premium.priceLabel}
            <span className="text-sm font-normal text-mute">/month</span>
          </p>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-mute">
          {premium.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-mute">Cancel any time from Settings.</p>
      </div>

      {receipt ? (
        <div className="mt-8 rounded-lg border border-azure bg-azure-soft p-4">
          <p className="text-sm font-medium">Payment already recorded</p>
          <p className="mt-1 text-xs text-mute">
            Receipt {receipt.ref} · card ending {receipt.cardLast4} ·{" "}
            {receipt.amount}
          </p>
          <Link
            href="/signup?plan=premium"
            className="btn-primary mt-3 inline-flex text-sm"
          >
            Continue to create your account
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CheckoutForm
            action={payPremiumAction}
            submitLabel={`Pay ${premium.priceLabel} and continue`}
          />
        </div>
      )}

      <p className="mt-6 text-center text-sm text-mute">
        Rather start free?{" "}
        <Link href="/signup?plan=free" className="text-azure">
          Create a Standard account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-mute">
        <Link href="/pricing" className="text-azure">
          Compare plans
        </Link>
      </p>
    </div>
  );
}
