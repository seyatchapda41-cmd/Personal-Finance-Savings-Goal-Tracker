import type { Metadata } from "next";
import { FEATURES } from "@/lib/marketing";

export const metadata: Metadata = { title: "Features" };

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Built for daily money habits
      </h1>
      <p className="mt-3 max-w-2xl text-mute">
        A complete ledger for daily money habits: accounts, categories, goals,
        and a founder panel to run the product. No bank sync, no crypto, no
        shared wallets — just the books, clearly.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="card">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-mute">{feature.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
