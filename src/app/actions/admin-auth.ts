"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/admin/audit";
import { adminPhones } from "@/lib/admin/access";
import { founderSeatOpen, getAdminSession, resolveAdminRole } from "@/lib/admin/session";
import { writeDemoAccount } from "@/lib/demo/accounts";
import { validatePassword } from "@/lib/password";
import { loginEmailForPhone } from "@/lib/auth/phone-identity";
import { isSupabaseConfigured } from "@/lib/config";
import { DEMO_SESSION_COOKIE, RESET_BOOKS_COOKIE } from "@/lib/cookie-names";
import { readDemoAccounts } from "@/lib/demo/accounts";
import { setDemoSession } from "@/lib/demo/session";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const PANEL_PATH = "/admin";

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
    await supabase?.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  store.delete(RESET_BOOKS_COOKIE);
  redirect("/admin/login");
}

export async function adminSignInAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!isValidPhone(phone) || !password) {
    return { error: "Enter your phone number and password, with the country code." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmailForPhone(phone),
      password,
    });
    if (error) {
      return {
        error: "That phone number and password do not match an account.",
      };
    }

    const resolved = await resolveAdminRole(phone);
    if (!resolved) {
      await supabase.auth.signOut();
      return {
        error: "Only the founder can open this panel.",
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
        await supabase.auth.signOut();
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

    await recordAudit({
      actorPhone: phone,
      actorRole: resolved.role,
      action: "admin.login",
    });
    redirect(PANEL_PATH);
  }

  const resolved = await resolveAdminRole(phone);
  if (!resolved) {
    return {
      error: "Only the founder can open this panel.",
    };
  }
  const accounts = await readDemoAccounts();
  const account = accounts[phone];
  if (!account) {
    return { error: "That phone number and password do not match an account." };
  }
  await setDemoSession(phone, account);
  await recordAudit({
    actorPhone: phone,
    actorRole: resolved.role,
    action: "admin.login",
  });
  redirect(PANEL_PATH);
}

export async function adminCreateFounderAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
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

    const { error: createError } = await admin.auth.admin.createUser({
      email: loginEmailForPhone(phone),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        plan: "free",
        staff: true,
      },
    });
    if (createError) {
      return {
        error: /already been registered|already exists/i.test(createError.message)
          ? "That phone already has an account. Sign in on this page instead."
          : createError.message,
      };
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmailForPhone(phone),
      password,
    });
    if (authError) return { error: authError.message };

    await recordAudit({
      actorPhone: phone,
      actorRole: "founder",
      action: "admin.founder.create",
    });
    redirect(PANEL_PATH);
  }

  await writeDemoAccount(phone, {
    email: "",
    fullName,
    plan: "free",
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
  redirect(PANEL_PATH);
}
