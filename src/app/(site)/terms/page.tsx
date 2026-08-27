import type { Metadata } from "next";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Terms of use</h1>
      <div className="mt-6 space-y-4 text-sm text-mute">
        <p>
          {APP_NAME} is a personal bookkeeping aid. It is not a bank, tax
          advisor, or investment product. You are responsible for the accuracy
          of the numbers you enter.
        </p>
        <p>
          Version one is provided free of charge. We may change features as the
          product grows. Do not use the service to store data you are not
          allowed to keep.
        </p>
        <p>
          Automated bank syncing, multi-currency conversion, cryptocurrency
          tracking, native mobile apps, and joint family accounts are not
          included.
        </p>
      </div>
    </div>
  );
}
