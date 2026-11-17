import { headers } from "next/headers";
import {
  AUTH_LOCK_MS,
  AUTH_MAX_FAILURES,
  authLockMessage,
  parseAuthLock,
  type AuthLockState,
} from "@/lib/auth/rate-limit";
import { canonicalPhone } from "@/lib/phone";
import { createAdminSupabase } from "@/lib/supabase/admin";

const IP_MAX_FAILURES = 30;
const SIGNUP_MAX = 20;

const memory = new Map<string, AuthLockState>();

function remember(bucket: string, state: AuthLockState) {
  memory.set(bucket, state);
  return state;
}

async function callerIp() {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  return ip.slice(0, 64);
}

async function readBucket(bucket: string) {
  const admin = createAdminSupabase();
  if (!admin) return memory.get(bucket) ?? parseAuthLock(null);
  const { data, error } = await admin
    .from("auth_attempt_limits")
    .select("failures, locked_until")
    .eq("bucket", bucket)
    .maybeSingle();
  if (error || !data) return memory.get(bucket) ?? parseAuthLock(null);
  return remember(bucket, parseAuthLock({
    failures: Number(data.failures) || 0,
    lockedUntil: data.locked_until ? new Date(data.locked_until).getTime() : 0,
  }));
}

async function writeBucket(bucket: string, state: AuthLockState) {
  remember(bucket, state);
  const admin = createAdminSupabase();
  if (!admin) return;
  await admin.from("auth_attempt_limits").upsert({
    bucket,
    failures: state.failures,
    locked_until: state.lockedUntil ? new Date(state.lockedUntil).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
}

function bump(state: AuthLockState, limit: number, now: number): AuthLockState {
  const current = parseAuthLock(state, now);
  const failures = current.failures + 1;
  if (failures >= limit) return { failures, lockedUntil: now + AUTH_LOCK_MS };
  return { failures, lockedUntil: 0 };
}

export async function signInBlockedMessage(phone: string) {
  const ip = await callerIp();
  const phoneState = await readBucket(`phone:${canonicalPhone(phone)}`);
  const ipState = await readBucket(`ip:${ip}`);
  return authLockMessage(phoneState) ?? authLockMessage(ipState);
}

export async function noteSignInFailure(phone: string) {
  const ip = await callerIp();
  const now = Date.now();
  const phoneBucket = `phone:${canonicalPhone(phone)}`;
  const ipBucket = `ip:${ip}`;
  await writeBucket(phoneBucket, bump(await readBucket(phoneBucket), AUTH_MAX_FAILURES, now));
  await writeBucket(ipBucket, bump(await readBucket(ipBucket), IP_MAX_FAILURES, now));
}

export async function clearSignInFailures(phone: string) {
  const bucket = `phone:${canonicalPhone(phone)}`;
  remember(bucket, parseAuthLock(null));
  const admin = createAdminSupabase();
  if (!admin) return;
  await admin.from("auth_attempt_limits").delete().eq("bucket", bucket);
}

export async function signupBlockedMessage() {
  const ip = await callerIp();
  if (authLockMessage(await readBucket(`signup:${ip}`))) {
    return "Too many new accounts from this network. Try again in a few minutes.";
  }
  return null;
}

export async function noteSignupAttempt() {
  const ip = await callerIp();
  const bucket = `signup:${ip}`;
  await writeBucket(bucket, bump(await readBucket(bucket), SIGNUP_MAX, Date.now()));
}
