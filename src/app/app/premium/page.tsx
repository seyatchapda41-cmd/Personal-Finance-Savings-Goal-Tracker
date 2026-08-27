"use client";

import Link from "next/link";
import { Stars } from "@/components/stars";
import { PLANS, SUPPORT_MAX_STARS } from "@/lib/plans";
import { useFinance } from "@/lib/finance-context";

function limitLabel(value: number | null) {
  return value === null ? "Unlimited" : String(value);
}

const CONDITIONS = [
  `Pay ${PLANS.premium.priceLabel} per month by card at checkout. Cancel any time from Settings.`,
  "Payment comes first: a new account is created on Premium only after the card is accepted.",
  "One payment covers one account. The receipt stays valid for 30 minutes, long enough to finish signing up.",
  "Already signed in? Paying from Settings moves your current account onto Premium straight away.",
  "Premium lasts while the subscription is paid. Switching back to Standard reapplies the Standard limits immediately.",
  `${PLANS.premium.support.label} comes with it: ${PLANS.premium.support.responseTime.toLowerCase()}, through ${PLANS.premium.support.channels.toLowerCase()}.`,
];

export default function PremiumPage() {
  const { ready, plan, limits, snapshot, monthlyTransactionCount } =
    useFinance();

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  const isPremium = plan === "premium";
  const free = PLANS.free;
  const premium = PLANS.premium;

  const rows = [
    {
      label: "Transactions per month",
      free: limitLabel(free.monthlyTransactions),
      premium: limitLabel(premium.monthlyTransactions),
    },
    {
      label: "Savings goals",
      free: limitLabel(free.goals),
      premium: limitLabel(premium.goals),
    },
    {
      label: "Categories",
      free: limitLabel(free.categories),
      premium: limitLabel(premium.categories),
    },
    {
      label: "History",
      free: "Current month",
      premium: "Every month",
    },
    {
      label: "CSV export",
      free: free.csvExport ? "Included" : "Not included",
      premium: premium.csvExport ? "Included" : "Not included",
    },
    {
      label: "Customer service",
      free: `${free.support.stars} of ${SUPPORT_MAX_STARS} stars`,
      premium: `${premium.support.stars} of ${SUPPORT_MAX_STARS} stars`,
    },
    {
      label: "Support replies",
      free: free.support.responseTime,
      premium: premium.support.responseTime,
    },
    {
      label: "Price",
      free: free.priceLabel,
      premium: `${premium.priceLabel}/month`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-sm text-mute">Premium pass</p>
        <h1 className="mt-1 text-3xl font-semibold">
          {isPremium ? "Your Premium pass is active" : "Get a Premium pass"}
        </h1>
        <p className="mt-2 text-sm text-mute">
          {isPremium
            ? "Every limit below is lifted on your account."
            : `You are on the ${free.label} plan. Here is what a Premium pass costs and what it changes.`}
        </p>
      </header>

      <section className="card">
        <h2 className="font-semibold">Your customer service level</h2>
        <p className="mt-3 text-sm">
          {limits.support.label} <Stars value={limits.support.stars} />
        </p>
        <p className="mt-1 text-sm text-mute">
          {limits.support.responseTime}. {limits.support.channels}.
        </p>
        {!isPremium ? (
          <p className="mt-3 text-xs text-mute">
            Premium moves you to {premium.support.stars} of{" "}
            {SUPPORT_MAX_STARS} stars:{" "}
            {premium.support.responseTime.toLowerCase()}, through{" "}
            {premium.support.channels.toLowerCase()}.
          </p>
        ) : null}
        <Link href="/app/support" className="btn-secondary mt-4 inline-flex">
          Contact customer service
        </Link>
      </section>

      <section className="card">
        <h2 className="font-semibold">Conditions</h2>
        <ul className="mt-4 space-y-3 text-sm text-mute">
          {CONDITIONS.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-semibold">{free.label} against {premium.label}</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="pb-2 font-medium">What you get</th>
              <th className="pb-2 font-medium">{free.label}</th>
              <th className="pb-2 font-medium">{premium.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="py-2">{row.label}</td>
                <td className="py-2 text-mute">{row.free}</td>
                <td className="py-2">{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="font-semibold">Where your account stands today</h2>
        <ul className="mt-4 space-y-2 text-sm text-mute">
          <li>
            Transactions this month: {monthlyTransactionCount}
            {limits.monthlyTransactions === null
              ? " (no limit)"
              : ` of ${limits.monthlyTransactions}`}
          </li>
          <li>
            Savings goals: {snapshot.goals.length}
            {limits.goals === null ? " (no limit)" : ` of ${limits.goals}`}
          </li>
          <li>
            Categories: {snapshot.categories.length}
            {limits.categories === null
              ? " (no limit)"
              : ` of ${limits.categories}`}
          </li>
          <li>CSV export: {limits.csvExport ? "available" : "Premium only"}</li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          {isPremium ? (
            <Link href="/app/settings" className="btn-primary">
              Manage in Settings
            </Link>
          ) : (
            <Link href="/checkout" className="btn-primary">
              Buy Premium ({premium.priceLabel}/month)
            </Link>
          )}
          <Link href="/app/account" className="btn-secondary">
            Back to account
          </Link>
        </div>
      </section>
    </div>
  );
}
