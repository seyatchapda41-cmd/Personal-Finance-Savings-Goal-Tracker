import type { Metadata } from "next";
import { STEPS } from "@/lib/marketing";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
      <p className="mt-3 text-mute">
        Sign up with your phone number, log money as it moves, and watch
        savings goals fill in.
      </p>
      <ol className="mt-10 space-y-6">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azure-strong text-sm text-white">
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm leading-6 text-mute">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
