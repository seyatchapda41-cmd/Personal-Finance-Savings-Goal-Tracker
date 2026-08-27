import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Privacy policy</h1>
      <div className="mt-6 space-y-4 text-sm text-mute">
        <p>
          {APP_NAME} stores the account details and financial records you enter:
          name, email, categories, transactions, and savings goals.
        </p>
        <p>
          We do not sell personal data. We do not connect to your bank in
          version one. Data is used only to operate the tracker you signed up
          for.
        </p>
        <p>
          In production, records live in a PostgreSQL database with row-level
          security so other customers cannot query your rows. You may request
          deletion of your account data by contacting us.
        </p>
        <p>Local demo mode keeps data in your browser until you clear site storage.</p>
      </div>
    </div>
  );
}
