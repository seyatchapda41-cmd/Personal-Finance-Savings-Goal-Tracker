"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readPlatformSettings } from "@/lib/admin/settings";
import { hashPassword, verifyPassword } from "@/lib/auth/password-hash";
import {
  clearSignInFailures,
  noteSignInFailure,
  noteSignupAttempt,
  signInBlockedMessage,
  signupBlockedMessage,
} from "@/lib/auth/attempt-guard";
import {
  createAuthUser,
  signInWithPhonePassword,
} from "@/lib/auth/phone-login";
import { clearPremiumReceipt, readPremiumReceipt } from "@/lib/billing-server";
import { isSupabaseConfigured } from "@/lib/config";
import { forgetAccount } from "@/lib/known-accounts-server";
import { AUTH_LOCK_COOKIE } from "@/lib/cookie-names";
import {
  authLockMessage,
  clearAuthLock,
  parseAuthLock,
  recordAuthFailure,
} from "@/lib/auth/rate-limit";
import {
  readDemoAccounts,
  removeDemoAccount,
  writeDemoAccount,
  type DemoAccount,
} from "@/lib/demo/accounts";
import { setDemoSession } from "@/lib/demo/session";
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/password";
import { attachPaymentToPhone } from "@/lib/payments";
import { canonicalPhone, isValidPhone, phoneLoginCandidates } from "@/lib/phone";
import { applyPlanToCurrentUser } from "@/lib/plan-store";
import { normalizePlan } from "@/lib/plans";
import { isAuthNetworkError } from "@/lib/supabase/fetch";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  DEMO_SESSION_COOKIE,
  RESET_BOOKS_COOKIE,
} from "@/lib/supabase/middleware";
import { createServerSupabase } from "@/lib/supabase/server";

// Where a freshly authenticated user lands.
const LANDING_PATH = "/app/account";

const DATABASE_UNREACHABLE =
  "Tempora cannot reach the database, so this was not saved. An account is stored there, and the same phone and password then work on any device. The Supabase address in .env.local does not resolve — restore that project or paste its current URL, then restart the site.";

function validateCredentials(phone: string, password: string) {
  if (!isValidPhone(phone)) {
    return "Enter a valid phone number with country code.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

async function readAuthLock() {
  const store = await cookies();
  const raw = store.get(AUTH_LOCK_COOKIE)?.value;
  if (!raw) return parseAuthLock(null);
  try {
    return parseAuthLock(JSON.parse(raw));
  } catch {
    return parseAuthLock(null);
  }
}

async function writeAuthLock(state: ReturnType<typeof parseAuthLock>) {
  const store = await cookies();
  store.set(AUTH_LOCK_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });
}

function safeNext(value: string) {
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("://")
  ) {
    return LANDING_PATH;
  }
  return value;
}

async function rememberCurrentDeviceProfile(phone: string) {
  await clearSignInFailures(phone);
  await writeAuthLock(clearAuthLock());
}

function demoAccountFor(
  accounts: Record<string, DemoAccount>,
  phone: string,
) {
  const keys = new Set<string>([phone]);
  for (const candidate of phoneLoginCandidates(phone)) {
    keys.add(canonicalPhone(candidate));
    keys.add(candidate);
  }
  for (const key of keys) {
    const account = accounts[key];
    if (account) return account;
  }
  return null;
}

async function rejectSignIn(phone: string, lock: ReturnType<typeof parseAuthLock>, error: string) {
  await noteSignInFailure(phone);
  await writeAuthLock(recordAuthFailure(lock));
  return { error };
}

export async function signInAction(formData: FormData) {
  const lock = await readAuthLock();
  const locked = authLockMessage(lock);
  if (locked) return { error: locked };

  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? LANDING_PATH));
  const error = validateCredentials(phone, password);
  if (error) return { error };

  const serverLock = await signInBlockedMessage(phone);
  if (serverLock) return { error: serverLock };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const signedIn = await signInWithPhonePassword(phone, password);
    if (signedIn.error) {
      if (isAuthNetworkError(signedIn.error)) {
        return { error: DATABASE_UNREACHABLE };
      }
      return rejectSignIn(phone, lock, signedIn.error);
    }
    if (!signedIn.error) {
      const admin = createAdminSupabase();
      if (admin) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: standing } = user
          ? await admin
              .from("profiles")
              .select("suspended, suspended_reason")
              .eq("id", user.id)
              .maybeSingle()
          : { data: null };
        if (standing?.suspended) {
          await supabase.auth.signOut({ scope: "global" });
          await writeAuthLock(recordAuthFailure(lock));
          return {
            error: `This account is suspended. ${
              standing.suspended_reason ?? ""
            } Contact customer service.`.trim(),
          };
        }
      }
      await rememberCurrentDeviceProfile(phone);
      redirect(next || LANDING_PATH);
    }
  }

  const accounts = await readDemoAccounts();
  const known = demoAccountFor(accounts, phone);
  if (!known) {
    return rejectSignIn(
      phone,
      lock,
      "That phone number and password do not match an account. The same phone and password work on any device once the account exists.",
    );
  }
  if (known.passwordHash) {
    if (!verifyPassword(password, known.passwordHash)) {
      return rejectSignIn(
        phone,
        lock,
        "That phone number and password do not match an account.",
      );
    }
  } else {
    known.passwordHash = hashPassword(password);
    await writeDemoAccount(phone, known);
  }
  await setDemoSession(phone, known);
  await rememberCurrentDeviceProfile(phone);
  redirect(next || LANDING_PATH);
}

export async function peekAccountAction(_formData: FormData) {
  return {};
}

export async function signUpAction(formData: FormData) {
  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const plan = normalizePlan(formData.get("plan"));
  const error = validateCredentials(phone, password);
  if (error) return { error };
  const weakPassword = validatePassword(password);
  if (weakPassword) return { error: weakPassword };
  if (!fullName) return { error: "Enter your name." };
  if (!validateEmail(email)) return { error: "Enter a valid email address." };

  const signupLock = await signupBlockedMessage();
  if (signupLock) return { error: signupLock };
  await noteSignupAttempt();

  const settings = await readPlatformSettings();
  if (!settings.signupsEnabled) {
    return { error: "New accounts are closed at the moment. Please try later." };
  }

  // A Premium account can only be created against a paid receipt.
  const receipt = plan === "premium" ? await readPremiumReceipt() : null;
  if (plan === "premium" && !receipt) {
    return {
      error: "Premium needs to be paid for first. Open Buy Premium to pay.",
    };
  }

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    if (!admin) {
      return {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is missing, so accounts cannot be created.",
      };
    }

    // Created straight away rather than through signUp, because a derived
    // address has no inbox to confirm from.
    const { error: createError } = await createAuthUser({
      phone,
      password,
      fullName,
      email,
      plan,
    });
    if (createError) {
      if (isAuthNetworkError(createError.message)) {
        return { error: DATABASE_UNREACHABLE };
      }
      return {
        error: /already been registered|already exists/i.test(
          createError.message,
        )
          ? "An account already uses that phone number. Log in instead."
          : createError.message,
      };
    }

    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const signedIn = await signInWithPhonePassword(phone, password);
    if (signedIn.error) {
      return {
        error: isAuthNetworkError(signedIn.error)
          ? "The account was saved. Sign in with the same phone and password. It will work on this device and on any other."
          : signedIn.error,
      };
    }
    if (receipt) await attachPaymentToPhone(receipt.ref, phone);
    await clearPremiumReceipt();
    await rememberCurrentDeviceProfile(phone);
    redirect(LANDING_PATH);
  }

  const account: DemoAccount = {
    email,
    fullName,
    plan,
    passwordHash: hashPassword(password),
  };
  await writeDemoAccount(phone, account);
  await setDemoSession(phone, account);
  if (receipt) await attachPaymentToPhone(receipt.ref, phone);
  await clearPremiumReceipt();
  await rememberCurrentDeviceProfile(phone);
  redirect(LANDING_PATH);
}

// Downgrades run from Settings. Upgrades go through checkout instead, so the
// Premium switch is only ever flipped after payment.
export async function changePlanAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const plan = normalizePlan(formData.get("plan"));
  if (plan === "premium") {
    return { error: "Use Buy Premium to upgrade." };
  }
  const result = await applyPlanToCurrentUser(plan);
  return "error" in result ? { error: result.error } : {};
}

// Deleting an account is irreversible, so the client has to type DELETE.
export async function deleteAccountAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const confirmation = String(formData.get("confirm") ?? "")
    .trim()
    .toUpperCase();
  if (confirmation !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }

  const store = await cookies();

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You are not signed in." };

    // Removes the auth user; profile, categories, transactions and goals
    // cascade from it.
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      return {
        error: `The account could not be deleted: ${error.message}. Run delete_own_account from supabase/schema.sql, then try again.`,
      };
    }
    await supabase.auth.signOut({ scope: "global" });
    const phone = (user.user_metadata?.phone as string | undefined) ?? "";
    if (phone) await forgetAccount(phone);
  } else {
    const raw = store.get(DEMO_SESSION_COOKIE)?.value;
    if (!raw) return { error: "You are not signed in." };
    let phone = "";
    try {
      phone = (JSON.parse(raw) as { phone?: string }).phone ?? "";
    } catch {
      return { error: "Your session could not be read. Log in again." };
    }
    if (phone) {
      await removeDemoAccount(phone);
      await forgetAccount(phone);
    }
  }

  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  await clearPremiumReceipt();
  redirect("/account-deleted");
}

export async function forgetAccountAction(userIdOrForm: FormData | string) {
  const id =
    typeof userIdOrForm === "string"
      ? userIdOrForm
      : String(userIdOrForm.get("userId") ?? userIdOrForm.get("phone") ?? "");
  await forgetAccount(id);
  revalidatePath("/signup");
  revalidatePath("/login");
  revalidatePath("/app");
}

export async function switchAccountAction(formData: FormData) {
  const userId = String(formData.get("userId") ?? "").trim();
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut({ scope: "local" });
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  if (userId) redirect(`/login?profile=${encodeURIComponent(userId)}`);
  redirect("/login");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut({ scope: "local" });
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  redirect("/");
}

// A derived login address has no inbox and there is no SMS provider, so a
// forgotten password is reset by customer service from the founder panel.
export async function resetPasswordAction(formData: FormData) {
  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  if (!isValidPhone(phone)) {
    return { error: "Enter a valid phone number with country code." };
  }

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    if (!admin) return { error: "Password resets are unavailable right now." };
    const { data } = await admin
      .from("profiles")
      .select("id, plan")
      .eq("phone", phone)
      .maybeSingle();
    // The same answer either way, so the form cannot be used to find out
    // which numbers hold an account.
    if (data) {
      await admin.from("support_messages").insert({
        user_id: data.id,
        ref: `PW-${Date.now().toString(36).toUpperCase()}`,
        plan: normalizePlan(data.plan),
        priority: normalizePlan(data.plan) === "premium" ? "priority" : "standard",
        subject: "Password reset request",
        message: `${phone} asked for a password reset from the Recover access page.`,
        callback_requested: true,
      });
    }
  }

  return { ok: true as const };
}
