import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">About {APP_NAME}</h1>
      <div className="mt-6 space-y-4 text-mute">
        <p>
          {APP_NAME} exists because most people already know they should track
          money — they just will not maintain a brittle spreadsheet.
        </p>
        <p>
          We built a focused web product: record transactions quickly, group
          them into categories, and keep savings goals visible. Analytics stay
          honest and local to your account.
        </p>
        <p>
          The product follows a published software requirements specification
          for a personal finance and savings goal tracker: authentication,
          transactions, categories, goals, and a dashboard — nothing more until
          those pieces are excellent.
        </p>
      </div>
    </div>
  );
}
