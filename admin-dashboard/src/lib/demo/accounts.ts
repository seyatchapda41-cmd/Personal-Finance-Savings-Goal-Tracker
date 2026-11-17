import { cookies } from "next/headers";
import { DEMO_ACCOUNTS_COOKIE } from "@/lib/supabase/middleware";
import type { Plan } from "@/lib/types";

export type DemoAccount = {
  email: string;
  fullName: string;
  plan: Plan;
  passwordHash?: string;
};

// Demo mode has no database, so each account (keyed by phone number) is
// remembered in a cookie and restored on the next sign in.
export async function readDemoAccounts(): Promise<Record<string, DemoAccount>> {
  const store = await cookies();
  const raw = store.get(DEMO_ACCOUNTS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, DemoAccount>;
  } catch {
    return {};
  }
}

export async function writeDemoAccount(phone: string, account: DemoAccount) {
  const accounts = await readDemoAccounts();
  accounts[phone] = account;
  await writeDemoAccounts(accounts);
}

export async function removeDemoAccount(phone: string) {
  const accounts = await readDemoAccounts();
  delete accounts[phone];
  await writeDemoAccounts(accounts);
}

async function writeDemoAccounts(accounts: Record<string, DemoAccount>) {
  const store = await cookies();
  store.set(DEMO_ACCOUNTS_COOKIE, JSON.stringify(accounts), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
