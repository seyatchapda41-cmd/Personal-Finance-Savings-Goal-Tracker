import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  const steps = [
    ["Create an account", "Sign up with email. Your records stay tied to you."],
    ["Set categories", "Start from sensible defaults, then rename or add your own."],
    ["Log money as it moves", "Add income and expenses. Totals refresh as soon as you save."],
    ["Name a savings goal", "Give it a target and a date. Update current saved as you go."],
    ["Check the dashboard", "See monthly health without rebuilding a spreadsheet."],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">How it works</h1>
      <ol className="mt-10 space-y-6">
        {steps.map(([title, body], index) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azure-strong text-sm text-white">
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-mute">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
