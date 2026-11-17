import { cookies } from "next/headers";
import {
  KNOWN_ACCOUNTS_COOKIE,
  mergeDeviceProfile,
  parseDeviceProfiles,
  profileFromAuth,
  removeDeviceProfile,
  type DeviceProfile,
} from "@/lib/device-profiles";

const YEAR = 60 * 60 * 24 * 365;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: YEAR,
  };
}

export async function readDeviceProfiles(): Promise<DeviceProfile[]> {
  const store = await cookies();
  const raw = store.get(KNOWN_ACCOUNTS_COOKIE)?.value;
  if (!raw) return [];
  try {
    return parseDeviceProfiles(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function rememberDeviceProfile(input: {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
}) {
  const store = await cookies();
  const next = mergeDeviceProfile(
    await readDeviceProfiles(),
    profileFromAuth(input),
  );
  store.set(KNOWN_ACCOUNTS_COOKIE, JSON.stringify(next), cookieOptions());
}

export async function forgetDeviceProfile(userId: string) {
  const store = await cookies();
  const next = removeDeviceProfile(await readDeviceProfiles(), userId);
  store.set(KNOWN_ACCOUNTS_COOKIE, JSON.stringify(next), cookieOptions());
}

/** @deprecated Prefer rememberDeviceProfile. */
export async function rememberAccount(account: {
  phone: string;
  fullName: string;
  plan?: string;
  userId?: string;
  email?: string;
}) {
  await rememberDeviceProfile({
    userId: account.userId || `user_${account.phone.replace(/\D/g, "")}`,
    fullName: account.fullName,
    email: account.email ?? "",
    phone: account.phone,
  });
}

export async function readKnownAccounts() {
  return readDeviceProfiles();
}

export async function forgetAccount(phoneOrId: string) {
  await forgetDeviceProfile(phoneOrId);
}
