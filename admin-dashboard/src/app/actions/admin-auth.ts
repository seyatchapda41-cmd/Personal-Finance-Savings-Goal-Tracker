"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/admin/audit";
import { adminPhones } from "@/lib/admin/access";
import { staffDeskCookieOptions } from "@/lib/admin/desk";
import { founderSeatOpen, getAdminSession, resolveAdminRole } from "@/lib/admin/session";
import { writeDemoAccount } from "@/lib/demo/accounts";
import { validatePassword } from "@/lib/password";
import {
  clearSignInFailures,
  noteSignInFailure,
  signInBlockedMessage,
} from "@/lib/auth/attempt-guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password-hash";
import {
  createAuthUser,
  signInWithPhonePassword,
} from "@/lib/auth/phone-login";
import { isSupabaseConfigured } from "@/lib/config";
import { isAuthNetworkError } from "@/lib/supabase/fetch";
import {
  DEMO_SESSION_COOKIE,
  RESET_BOOKS_COOKIE,
  STAFF_DESK_COOKIE,
} from "@/lib/cookie-names";
import { readDemoAccounts } from "@/lib/demo/accounts";
import { setDemoSession } from "@/lib/demo/session";
import { canonicalPhone, isValidPhone } from "@/lib/phone";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const PANEL_PATH = "/";

function authError(message: string) {
  if (!isAuthNetworkError(message)) return message;
  return "The panel cannot reach Supabase, so sign-in stopped. The project address in the admin app does not resolve. Restore that project or paste its current URL into admin-dashboard/.env.local, then restart the admin site.";
}

async function markStaffDesk() {
  const store = await cookies();
  store.set(STAFF_DESK_COOKIE, "on", staffDeskCookieOptions());
}

export async function adminSignOutAction() {
  const session = await getAdminSession();
  if (session) {
    await recordAudit({
      actorPhone: session.phone,
      actorRole: session.role,
      action: "admin.logout",
    });
  }
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    await supabase?.auth.signOut({ scope: "local" });
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  redirect("/login");
}

export async function adminSignInAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!isValidPhone(phone) || !password) {
    return { error: "Enter your phone number and password, with the country code." };
  }

  const blocked = await signInBlockedMessage(phone);
  if (blocked) return { error: blocked };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };

    const signedIn = await signInWithPhonePassword(phone, password);
    if (signedIn.error) {
      if (!isAuthNetworkError(signedIn.error)) await noteSignInFailure(phone);
      return { error: authError(signedIn.error) };
    }

    const resolved = await resolveAdminRole(phone);
    if (!resolved || resolved.role !== "founder") {
      await supabase.auth.signOut({ scope: "local" });
      return {
        error:
          "This phone is not the founder account. The control panel is locked to the founder — use that phone on this page, not a client login.",
      };
    }

    const admin = createAdminSupabase();
    if (admin) {
      const { data: standing } = await admin
        .from("profiles")
        .select("suspended")
        .eq("phone", phone)
        .maybeSingle();
      if (standing?.suspended) {
        await supabase.auth.signOut({ scope: "global" });
        await recordAudit({
          actorPhone: phone,
          actorRole: resolved.role,
          action: "admin.login",
          outcome: "denied",
          detail: { reason: "account suspended" },
        });
        return { error: "This account is suspended." };
      }
    }

    await clearSignInFailures(phone);
    await recordAudit({
      actorPhone: phone,
      actorRole: resolved.role,
      action: "admin.login",
    });
    await markStaffDesk();
    redirect(PANEL_PATH);
  }

  const resolved = await resolveAdminRole(phone);
  if (!resolved || resolved.role !== "founder") {
    return {
      error:
        "This phone is not the founder account. The control panel is locked to the founder — use that phone on this page, not a client login.",
    };
  }
  const accounts = await readDemoAccounts();
  const account = accounts[phone];
  if (!account) {
    await noteSignInFailure(phone);
    return { error: "That phone number and password do not match an account." };
  }
  if (account.passwordHash && !verifyPassword(password, account.passwordHash)) {
    await noteSignInFailure(phone);
    return { error: "That phone number and password do not match an account." };
  }
  await clearSignInFailures(phone);
  await setDemoSession(phone, account);
  await recordAudit({
    actorPhone: phone,
    actorRole: resolved.role,
    action: "admin.login",
  });
  await markStaffDesk();
  redirect(PANEL_PATH);
}

export async function adminCreateFounderAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!isValidPhone(phone)) {
    return { error: "Enter a phone number with its country code." };
  }
  if (!fullName) return { error: "Enter your name." };
  const weak = validatePassword(password);
  if (weak) return { error: weak };

  if (!(await founderSeatOpen())) {
    return {
      error: "A founder already exists. Sign in instead.",
    };
  }

  const reserved = adminPhones();
  if (reserved.length > 0 && !reserved.includes(phone)) {
    return {
      error:
        "This panel is locked to the founder number in ADMIN_PHONES. Use that phone, or change ADMIN_PHONES in .env.local and restart.",
    };
  }

  if (isSupabaseConfigured()) {
    const admin = createAdminSupabase();
    if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is missing." };

    const { error: createError } = await createAuthUser({
      phone,
      password,
      fullName,
      staff: true,
    });
    const alreadyRegistered = Boolean(
      createError &&
        /already been registered|already exists/i.test(createError.message),
    );
    if (createError && !alreadyRegistered) {
      return { error: authError(createError.message) };
    }

    const { error: seatError } = await admin.from("admin_users").insert({
      phone,
      role: "founder",
      full_name: fullName,
      created_by: "founder-setup",
    });
    if (seatError && seatError.code !== "23505") {
      return { error: `Could not record the founder seat: ${seatError.message}` };
    }

    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const signedIn = await signInWithPhonePassword(phone, password);
    const signInError = signedIn.error
      ? { message: signedIn.error }
      : null;
    if (signInError) {
      return {
        error: alreadyRegistered
          ? "That phone already has an account. Use the password for that account."
          : signInError.message,
      };
    }

    await recordAudit({
      actorPhone: phone,
      actorRole: "founder",
      action: "admin.founder.create",
    });
    await markStaffDesk();
    redirect(PANEL_PATH);
  }

  await writeDemoAccount(phone, {
    email: "",
    fullName,
    plan: "free",
    passwordHash: hashPassword(password),
  });
  const accounts = await readDemoAccounts();
  const account = accounts[phone];
  if (!account) return { error: "Could not store the founder account." };
  await setDemoSession(phone, account);
  await recordAudit({
    actorPhone: phone,
    actorRole: "founder",
    action: "admin.founder.create",
  });
  await markStaffDesk();
  redirect(PANEL_PATH);
}

export async function adminRegisterAccountAction(
  formData: FormData,
): Promise<{ error?: string; ok?: true }> {
  const session = await getAdminSession();
  if (!session || session.role !== "founder") {
    return { error: "Only the founder can create an account from the panel." };
  }

  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!fullName) return { error: "Enter the account name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (!isValidPhone(phone)) {
    return { error: "Enter a phone number with its country code." };
  }
  const weak = validatePassword(password);
  if (weak) return { error: weak };
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured, so this account cannot be saved." };
  }

  const { error: createError } = await createAuthUser({
    phone,
    password,
    fullName,
    email,
    plan: "free",
  });
  if (createError) {
    if (isAuthNetworkError(createError.message)) {
      return { error: authError(createError.message) };
    }
    return {
      error: /already been registered|already exists/i.test(createError.message)
        ? "An account already uses that phone number. It is still saved. Sign in with that phone and password."
        : createError.message,
    };
  }

  return { ok: true };
}
