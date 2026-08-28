"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readPlatformSettings } from "@/lib/admin/settings";
import { loginEmailForPhone } from "@/lib/auth/phone-identity";
import { getCurrentProfile } from "@/lib/auth/profile";
import { clearPremiumReceipt, readPremiumReceipt } from "@/lib/billing-server";
import { isSupabaseConfigured } from "@/lib/config";
import {
  forgetAccount,
  rememberAccount,
} from "@/lib/known-accounts-server";
import {
  readDemoAccounts,
  removeDemoAccount,
  writeDemoAccount,
  type DemoAccount,
} from "@/lib/demo/accounts";
import { setDemoSession } from "@/lib/demo/session";
import { MIN_PASSWORD_LENGTH, validatePassword } from "@/lib/password";
import { attachPaymentToPhone } from "@/lib/payments";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { applyPlanToCurrentUser } from "@/lib/plan-store";
import { normalizePlan } from "@/lib/plans";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  DEMO_SESSION_COOKIE,
  RESET_BOOKS_COOKIE,
} from "@/lib/supabase/middleware";
import { createServerSupabase } from "@/lib/supabase/server";

// Where a freshly authenticated user lands.
const LANDING_PATH = "/app/account";

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

export async function signInAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? LANDING_PATH);
  const error = validateCredentials(phone, password);
  if (error) return { error };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmailForPhone(phone),
      password,
    });
    if (authError) {
      return {
        error:
          authError.message === "Invalid login credentials"
            ? "That phone number and password do not match an account."
            : authError.message,
      };
    }

    // A suspended account must not get a session, even with the right password.
    const admin = createAdminSupabase();
    if (admin) {
      const { data: standing } = await admin
        .from("profiles")
        .select("suspended, suspended_reason")
        .eq("phone", phone)
        .maybeSingle();
      if (standing?.suspended) {
        await supabase.auth.signOut();
        return {
          error: `This account is suspended. ${
            standing.suspended_reason ?? ""
          } Contact customer service.`.trim(),
        };
      }
    }
    const profile = await getCurrentProfile();
    await rememberAccount({
      phone,
      fullName: profile?.fullName || phone,
      plan: profile?.plan ?? "free",
    });
    redirect(next || LANDING_PATH);
  }

  const accounts = await readDemoAccounts();
  const known = accounts[phone];
  if (!known) {
    return {
      error: "No account uses that phone number. Sign up to create one.",
    };
  }
  await setDemoSession(phone, known);
  await rememberAccount({ phone, fullName: known.fullName, plan: known.plan });
  redirect(next || LANDING_PATH);
}

export async function signUpAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
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
    const { error: createError } = await admin.auth.admin.createUser({
      email: loginEmailForPhone(phone),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, email, plan, phone },
    });
    if (createError) {
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmailForPhone(phone),
      password,
    });
    if (authError) return { error: authError.message };
    if (receipt) await attachPaymentToPhone(receipt.ref, phone);
    await clearPremiumReceipt();
    await rememberAccount({ phone, fullName, plan });
    redirect(LANDING_PATH);
  }

  const account: DemoAccount = { email, fullName, plan };
  await writeDemoAccount(phone, account);
  await setDemoSession(phone, account);
  if (receipt) await attachPaymentToPhone(receipt.ref, phone);
  await clearPremiumReceipt();
  await rememberAccount({ phone, fullName, plan });
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
    await supabase.auth.signOut();
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

export async function forgetAccountAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  await forgetAccount(phone);
  revalidatePath("/signup");
  revalidatePath("/login");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  redirect("/");
}

// A derived login address has no inbox and there is no SMS provider, so a
// forgotten password is reset by customer service from the founder panel.
export async function resetPasswordAction(formData: FormData) {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
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
