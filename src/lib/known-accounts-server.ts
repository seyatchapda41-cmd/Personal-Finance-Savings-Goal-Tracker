import { cookies } from "next/headers";
import {
  KNOWN_ACCOUNTS_COOKIE,
  mergeKnownAccount,
  type KnownAccount,
} from "@/lib/known-accounts";

export async function readKnownAccounts(): Promise<KnownAccount[]> {
  const store = await cookies();
  const raw = store.get(KNOWN_ACCOUNTS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as KnownAccount[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((account) => Boolean(account?.phone));
  } catch {
    return [];
  }
}

export async function rememberAccount(account: KnownAccount) {
  const store = await cookies();
  const accounts = mergeKnownAccount(await readKnownAccounts(), account);
  store.set(KNOWN_ACCOUNTS_COOKIE, JSON.stringify(accounts), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function forgetAccount(phone: string) {
  const store = await cookies();
  const accounts = (await readKnownAccounts()).filter((a) => a.phone !== phone);
  store.set(KNOWN_ACCOUNTS_COOKIE, JSON.stringify(accounts), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
