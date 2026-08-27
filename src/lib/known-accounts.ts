import type { Plan } from "@/lib/types";

export const KNOWN_ACCOUNTS_COOKIE = "tempora_known_accounts";
export const MAX_KNOWN_ACCOUNTS = 5;

// Accounts that have signed in on this device, so someone who lands on the
// signup page can pick an account they already have instead of making another.
export type KnownAccount = {
  phone: string;
  fullName: string;
  plan: Plan;
};

export function mergeKnownAccount(
  accounts: KnownAccount[],
  account: KnownAccount,
) {
  const others = accounts.filter((a) => a.phone !== account.phone);
  return [account, ...others].slice(0, MAX_KNOWN_ACCOUNTS);
}
