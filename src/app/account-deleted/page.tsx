import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/logo";
import { NightModeToggle } from "@/components/night-mode-toggle";
import { nightFromCookieStore } from "@/lib/themes";

export const metadata: Metadata = { title: "Account deleted" };

export default async function AccountDeletedPage() {
  const store = await cookies();
  const night = nightFromCookieStore(store);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="flex items-center justify-between gap-3">
        <Logo />
        <NightModeToggle initialNight={night} />
      </div>
      <h1 className="mt-8 text-2xl font-semibold">Your account is deleted</h1>
      <p className="mt-2 text-sm text-mute">
        The login, transactions, categories and savings goals on it are gone and
        cannot be recovered. Nothing is left to sign in to.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/signup" className="btn-primary">
          Create a new account
        </Link>
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
