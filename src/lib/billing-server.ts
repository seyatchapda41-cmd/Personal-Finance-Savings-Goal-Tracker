import { cookies } from "next/headers";
import {
  PREMIUM_RECEIPT_COOKIE,
  RECEIPT_TTL_SECONDS,
  type PremiumReceipt,
} from "@/lib/billing";

export async function savePremiumReceipt(receipt: PremiumReceipt) {
  const store = await cookies();
  store.set(PREMIUM_RECEIPT_COOKIE, JSON.stringify(receipt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RECEIPT_TTL_SECONDS,
  });
}

export async function readPremiumReceipt(): Promise<PremiumReceipt | null> {
  const store = await cookies();
  const raw = store.get(PREMIUM_RECEIPT_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PremiumReceipt;
    return parsed.ref ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearPremiumReceipt() {
  const store = await cookies();
  store.delete(PREMIUM_RECEIPT_COOKIE);
}
