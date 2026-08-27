"use server";

import { revalidatePath } from "next/cache";
import { isAdminPhone } from "@/lib/admin/access";
import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { removeDemoAccount } from "@/lib/demo/accounts";
import { updateDemoPayment, updateDemoSupport } from "@/lib/demo/ledger";
import { forgetAccount } from "@/lib/known-accounts-server";
import { normalizePlan } from "@/lib/plans";
import { createAdminSupabase } from "@/lib/supabase/admin";

type Result = { error?: string; ok?: true };

const DEMO_LIMIT =
  "That needs the database. Without Supabase this data lives in each client's own browser.";

async function requireFounder() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." } as const;
  if (!isAdminPhone(profile.phone)) {
    return { error: "This account is not allowed to use the panel." } as const;
  }
  return { profile } as const;
}

function refresh() {
  revalidatePath("/admin", "layout");
}

// Closes a client's account for good, with every row that belongs to it.
export async function adminDeleteClientAction(
  formData: FormData,
): Promise<Result> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");
  if (!clientId && !phone) return { error: "No client was named." };
  if (guard.profile.phone === phone) {
    return { error: "Use Settings to delete your own account." };
  }

  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
    const { error } = await supabase.auth.admin.deleteUser(clientId);
    if (error) return { error: `Could not delete the account: ${error.message}` };
  } else {
    await removeDemoAccount(phone);
  }

  if (phone) await forgetAccount(phone);
  refresh();
  return { ok: true };
}

// Cancels a single client transaction.
export async function adminCancelTransactionAction(
  formData: FormData,
): Promise<Result> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const id = String(formData.get("transactionId") ?? "");
  if (!id) return { error: "No transaction was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = createAdminSupabase();
  if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: `Could not cancel it: ${error.message}` };
  refresh();
  return { ok: true };
}

export async function adminSetPlanAction(formData: FormData): Promise<Result> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const plan = normalizePlan(formData.get("plan"));
  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");

  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
    const { error } = await supabase.auth.admin.updateUserById(clientId, {
      user_metadata: { plan },
    });
    if (error) return { error: `Could not change the plan: ${error.message}` };
    await supabase.from("profiles").update({ plan }).eq("id", clientId);
  } else {
    return {
      error:
        "Without the database, a client's plan can only change from their own browser.",
    };
  }

  if (phone) refresh();
  refresh();
  return { ok: true };
}

// Marks a payment refunded. Money movement happens with the card provider.
export async function adminRefundPaymentAction(
  formData: FormData,
): Promise<Result> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const ref = String(formData.get("ref") ?? "");
  if (!ref) return { error: "No payment was named." };

  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
    const { error } = await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("ref", ref);
    if (error) return { error: `Could not update it: ${error.message}` };
  } else {
    await updateDemoPayment(ref, { status: "refunded" });
  }

  refresh();
  return { ok: true };
}

// Sets a new password for a client who has lost theirs, and hands it back once
// so customer service can pass it on.
export async function adminResetPasswordAction(
  formData: FormData,
): Promise<{ error?: string; password?: string }> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return { error: "No client was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = createAdminSupabase();
  if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const password = temporaryPassword();
  const { error } = await supabase.auth.admin.updateUserById(clientId, {
    password,
  });
  if (error) return { error: `Could not set a new password: ${error.message}` };
  return { password };
}

// Meets the signup rules: length, a capital letter and a number.
function temporaryPassword() {
  const noise = Math.random().toString(36).slice(2, 8);
  return `Tmp${noise}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function adminSetSupportStatusAction(
  formData: FormData,
): Promise<Result> {
  const guard = await requireFounder();
  if ("error" in guard) return guard;

  const ref = String(formData.get("ref") ?? "");
  const raw = String(formData.get("status") ?? "");
  const status =
    raw === "answered" || raw === "closed" || raw === "open" ? raw : null;
  if (!ref || !status) return { error: "Nothing to update." };

  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };
    const { error } = await supabase
      .from("support_messages")
      .update({ status })
      .eq("ref", ref);
    if (error) return { error: `Could not update it: ${error.message}` };
  } else {
    await updateDemoSupport(ref, { status });
  }

  refresh();
  return { ok: true };
}
