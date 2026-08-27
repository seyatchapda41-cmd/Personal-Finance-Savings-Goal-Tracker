import type { Metadata } from "next";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  const features = [
    ["Authentication", "Secure sign up, login, and session management."],
    ["Transactions", "Log income and expenses with amount, date, category, and notes."],
    ["Categories", "Organize money your way — income vs expense, per account."],
    ["Savings goals", "Target amount, current progress, and a date you care about."],
    ["Dashboard", "Monthly income, expenses, net, and goal status at a glance."],
    ["Responsive web", "Works in desktop, tablet, and mobile browsers."],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Built for daily money habits</h1>
      <p className="mt-3 max-w-2xl text-mute">
        Version one stays focused: no bank sync, no crypto, no shared family
        wallets. Just a clear ledger and goals you actually finish.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {features.map(([title, body]) => (
          <div key={title} className="card">
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-mute">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
