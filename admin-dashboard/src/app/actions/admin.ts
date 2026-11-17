"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAudit } from "@/lib/admin/audit";
import { can, type Permission } from "@/lib/admin/rbac";
import { getAdminSession, type AdminSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/config";
import { removeDemoAccount } from "@/lib/demo/accounts";
import { updateDemoPayment, updateDemoSupport, addDemoSupportReply } from "@/lib/demo/ledger";
import { forgetAccount } from "@/lib/known-accounts-server";
import { canonicalPhone, isValidPhone, phoneLoginCandidates } from "@/lib/phone";
import { normalizePlan } from "@/lib/plans";
import { validateSupportReply } from "@/lib/support";
import { createAdminSupabase } from "@/lib/supabase/admin";

type Result = { error?: string; ok?: true };

const DEMO_LIMIT =
  "That needs the database. Without Supabase this data lives in each client's own browser.";

const NO_KEY = "SUPABASE_SERVICE_ROLE_KEY is not set.";

// Single gate for every action: confirms the caller is an admin, confirms the
// role carries the permission, and records refusals in the audit trail.
async function authorize(
  permission: Permission,
  action: string,
): Promise<{ session: AdminSession } | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "You are not allowed to use the panel." };

  if (!can(session.role, permission)) {
    await recordAudit({
      actorPhone: session.phone,
      actorRole: session.role,
      action,
      outcome: "denied",
      detail: { missingPermission: permission },
    });
    return {
      error: `Your role cannot do this. ${permission} is reserved for the founder.`,
    };
  }

  return { session };
}

function refresh() {
  revalidatePath("/", "layout");
}

async function db() {
  const supabase = createAdminSupabase();
  return supabase;
}

/* ---------------------------------------------------------------- clients */

export async function adminSetSuspendedAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("clients.suspend", "client.suspend");
  if ("error" in auth) return auth;

  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const suspended = formData.get("suspended") === "true";
  const reason = String(formData.get("reason") ?? "").slice(0, 300);
  if (!clientId) return { error: "No client was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };

  const { error } = await supabase
    .from("profiles")
    .update({
      suspended,
      suspended_reason: suspended ? reason || "No reason given." : null,
    })
    .eq("id", clientId);
  if (error) return { error: `Could not update the account: ${error.message}` };

  // A suspended client must not keep an old session alive.
  if (suspended) await supabase.auth.admin.signOut(clientId).catch(() => {});

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: suspended ? "client.suspend" : "client.restore",
    targetType: "client",
    targetLabel: phone,
    detail: suspended ? { reason } : undefined,
  });
  refresh();
  return { ok: true };
}

function isUserId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function sameAccount(left: string, right: string) {
  const a = canonicalPhone(left);
  const b = canonicalPhone(right);
  return Boolean(a && b && a === b);
}

// Child rows that point at categories must go before the categories themselves.
// A plain auth delete can stop on that link and leave the account in place.
async function eraseAccountRows(
  supabase: NonNullable<Awaited<ReturnType<typeof db>>>,
  userId: string,
  phone: string,
) {
  const ignored = (message: string) =>
    /does not exist|schema cache/i.test(message);

  async function run(
    label: string,
    query: PromiseLike<{ error: { message: string } | null }>,
  ) {
    const { error } = await query;
    if (error && !ignored(error.message)) {
      throw new Error(`Could not clear ${label}: ${error.message}`);
    }
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", userId);
  const transactionIds = (transactions ?? []).map((row) => String(row.id));
  if (transactionIds.length > 0) {
    await run(
      "transaction reviews",
      supabase.from("transaction_reviews").delete().in("transaction_id", transactionIds),
    );
  }
  await run(
    "transactions",
    supabase.from("transactions").update({ reverses_id: null }).eq("user_id", userId),
  );
  await run(
    "transactions",
    supabase.from("transactions").delete().eq("user_id", userId),
  );
  await run("categories", supabase.from("categories").delete().eq("user_id", userId));
  await run("goals", supabase.from("savings_goals").delete().eq("user_id", userId));
  await run("budgets", supabase.from("monthly_budgets").delete().eq("user_id", userId));

  const { data: tickets } = await supabase
    .from("support_messages")
    .select("id")
    .eq("user_id", userId);
  const ticketIds = (tickets ?? []).map((row) => String(row.id));
  if (ticketIds.length > 0) {
    await run(
      "support replies",
      supabase.from("support_replies").delete().in("ticket_id", ticketIds),
    );
  }
  await run(
    "support requests",
    supabase.from("support_messages").delete().eq("user_id", userId),
  );
  await run(
    "review replies",
    supabase.from("project_review_replies").delete().eq("user_id", userId),
  );
  const { data: reviews } = await supabase
    .from("project_reviews")
    .select("id")
    .eq("user_id", userId);
  const reviewIds = (reviews ?? []).map((row) => String(row.id));
  if (reviewIds.length > 0) {
    await run(
      "review replies",
      supabase.from("project_review_replies").delete().in("review_id", reviewIds),
    );
  }
  await run("reviews", supabase.from("project_reviews").delete().eq("user_id", userId));
  await run(
    "payments",
    supabase.from("payments").update({ user_id: null }).eq("user_id", userId),
  );

  const phones = [...new Set([phone, ...phoneLoginCandidates(phone)].filter(Boolean))];
  if (phones.length > 0) {
    await run("staff seat", supabase.from("admin_users").delete().in("phone", phones));
  }
}

export async function adminDeleteClientAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("clients.delete", "client.delete");
  if ("error" in auth) return auth;

  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");
  if (!clientId && !phone) return { error: "No client was named." };
  if (
    clientId === auth.session.userId ||
    sameAccount(auth.session.phone, phone)
  ) {
    return { error: "Use Settings to delete your own account." };
  }

  if (isSupabaseConfigured()) {
    const supabase = await db();
    if (!supabase) return { error: NO_KEY };

    let userId = isUserId(clientId) ? clientId : "";
    let storedPhone = phone;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("id, phone")
        .eq("id", userId)
        .maybeSingle();
      if (data?.phone) storedPhone = String(data.phone);
      if (data?.id) userId = String(data.id);
    }
    if (!userId) {
      const candidates = phoneLoginCandidates(phone);
      const { data } = await supabase
        .from("profiles")
        .select("id, phone")
        .in("phone", candidates.length > 0 ? candidates : [phone]);
      const match = (data ?? [])[0];
      if (match?.id) {
        userId = String(match.id);
        storedPhone = String(match.phone ?? phone);
      }
    }
    if (!userId) return { error: "That account is not in the database." };
    if (
      userId === auth.session.userId ||
      sameAccount(auth.session.phone, storedPhone)
    ) {
      return { error: "Use Settings to delete your own account." };
    }

    try {
      await eraseAccountRows(supabase, userId, storedPhone);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not clear the account.";
      return { error: message };
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { error: `Could not delete the account: ${error.message}` };
    await forgetAccount(storedPhone);
    if (phone && phone !== storedPhone) await forgetAccount(phone);
  } else {
    await removeDemoAccount(phone);
    await forgetAccount(phone);
  }

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "client.delete",
    targetType: "client",
    targetLabel: phone,
  });
  refresh();
  redirect("/clients");
}

export async function adminSetPlanAction(formData: FormData): Promise<Result> {
  const auth = await authorize("clients.plan", "client.plan");
  if ("error" in auth) return auth;

  const plan = normalizePlan(formData.get("plan"));
  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Without the database, a client's plan can only change from their own browser.",
    };
  }

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };
  const { error } = await supabase.auth.admin.updateUserById(clientId, {
    user_metadata: { plan },
  });
  if (error) return { error: `Could not change the plan: ${error.message}` };
  await supabase.from("profiles").update({ plan }).eq("id", clientId);

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "client.plan",
    targetType: "client",
    targetLabel: phone,
    detail: { plan },
  });
  refresh();
  return { ok: true };
}

// Sets a new password for a client who has lost theirs, and hands it back once
// so customer service can pass it on.
export async function adminResetPasswordAction(
  formData: FormData,
): Promise<{ error?: string; password?: string }> {
  const auth = await authorize("clients.password", "client.password");
  if ("error" in auth) return auth;

  const clientId = String(formData.get("clientId") ?? "");
  const phone = String(formData.get("phone") ?? "");
  if (!clientId) return { error: "No client was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };

  const password = temporaryPassword();
  const { error } = await supabase.auth.admin.updateUserById(clientId, {
    password,
  });
  if (error) return { error: `Could not set a new password: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "client.password",
    targetType: "client",
    targetLabel: phone,
  });
  return { password };
}

// Meets the signup rules: length, a capital letter and a number.
function temporaryPassword() {
  const noise = Math.random().toString(36).slice(2, 8);
  return `Tmp${noise}${Math.floor(Math.random() * 90 + 10)}`;
}

/* ----------------------------------------------------------- transactions */

async function loadTransaction(id: string) {
  const supabase = await db();
  if (!supabase) return { error: NO_KEY } as const;
  const { data, error } = await supabase
    .from("transactions")
    .select("id, user_id, category_id, amount, date, description, origin, reverses_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return { error: error.message } as const;
  if (!data) return { error: "That record is gone." } as const;
  return { row: data, supabase };
}

async function alreadyReversed(
  supabase: NonNullable<Awaited<ReturnType<typeof db>>>,
  id: string,
) {
  const { data } = await supabase
    .from("transactions")
    .select("id")
    .eq("reverses_id", id)
    .maybeSingle();
  return Boolean(data);
}

// Removes a mistaken client-origin row. Staff corrections and reversals stay;
// those are undone with a reversal, not a delete, so the trail remains.
export async function adminCancelTransactionAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("transactions.cancel", "transaction.cancel");
  if ("error" in auth) return auth;

  const id = String(formData.get("transactionId") ?? "");
  const label = String(formData.get("label") ?? "");
  if (!id) return { error: "No transaction was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const loaded = await loadTransaction(id);
  if ("error" in loaded) return loaded;
  if (loaded.row.origin !== "client") {
    return { error: "Staff rows cannot be cancelled. Reverse them instead." };
  }
  if (await alreadyReversed(loaded.supabase, id)) {
    return { error: "That row already has a reversal. Leave both halves in place." };
  }

  const { error } = await loaded.supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: `Could not cancel it: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "transaction.cancel",
    targetType: "transaction",
    targetLabel: label || id,
  });
  refresh();
  return { ok: true };
}

// Posts an opposite-signed row so the original stays visible and the net
// effect on the client's books becomes zero.
export async function adminReverseTransactionAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("transactions.reverse", "transaction.reverse");
  if ("error" in auth) return auth;

  const id = String(formData.get("transactionId") ?? "");
  const label = String(formData.get("label") ?? "");
  if (!id) return { error: "No transaction was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const loaded = await loadTransaction(id);
  if ("error" in loaded) return loaded;
  if (loaded.row.origin === "reversal") {
    return { error: "A reversal cannot itself be reversed." };
  }
  if (await alreadyReversed(loaded.supabase, id)) {
    return { error: "That row is already reversed." };
  }

  const { error } = await loaded.supabase.from("transactions").insert({
    user_id: loaded.row.user_id,
    category_id: loaded.row.category_id,
    amount: loaded.row.amount,
    date: loaded.row.date,
    description: loaded.row.description
      ? `Reversal of: ${loaded.row.description}`
      : "Reversal",
    origin: "reversal",
    reverses_id: loaded.row.id,
    created_by: auth.session.phone,
  });
  if (error) return { error: `Could not reverse it: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "transaction.reverse",
    targetType: "transaction",
    targetLabel: label || id,
  });
  refresh();
  return { ok: true };
}

export async function adminEditTransactionAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("transactions.edit", "transaction.edit");
  if ("error" in auth) return auth;

  const id = String(formData.get("transactionId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").slice(0, 240);
  if (!id) return { error: "No transaction was named." };
  if (!categoryId || !date || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount, date and category are required." };
  }
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const loaded = await loadTransaction(id);
  if ("error" in loaded) return loaded;
  if (loaded.row.origin !== "client") {
    return { error: "Only a client's own row can be edited. Post a correction instead." };
  }
  if (await alreadyReversed(loaded.supabase, id)) {
    return { error: "A reversed row is left as history. Post a new correction if needed." };
  }

  const { error } = await loaded.supabase
    .from("transactions")
    .update({
      category_id: categoryId,
      amount,
      date,
      description,
    })
    .eq("id", id);
  if (error) return { error: `Could not save it: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "transaction.edit",
    targetType: "transaction",
    targetLabel: id,
    detail: {
      before: {
        amount: loaded.row.amount,
        date: loaded.row.date,
        categoryId: loaded.row.category_id,
      },
      after: { amount, date, categoryId },
    },
  });
  refresh();
  return { ok: true };
}

export async function adminAdjustTransactionAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("transactions.adjust", "transaction.adjust");
  if ("error" in auth) return auth;

  const clientId = String(formData.get("clientId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amount = Number(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").slice(0, 240);
  if (!clientId || !categoryId || !date || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Client, category, amount and date are required." };
  }
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };

  const { data: category } = await supabase
    .from("categories")
    .select("id, user_id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category || String(category.user_id) !== clientId) {
    return { error: "That category does not belong to this client." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: clientId,
    category_id: categoryId,
    amount,
    date,
    description: description || "Staff correction",
    origin: "admin",
    created_by: auth.session.phone,
  });
  if (error) return { error: `Could not post the correction: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "transaction.adjust",
    targetType: "client",
    targetLabel: clientId,
    detail: { amount, date, categoryId },
  });
  refresh();
  return { ok: true };
}

export async function adminReviewTransactionAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("transactions.review", "transaction.review");
  if ("error" in auth) return auth;

  const id = String(formData.get("transactionId") ?? "");
  const flagged = formData.get("flagged") === "true";
  const reason = String(formData.get("reason") ?? "").slice(0, 300);
  if (!id) return { error: "No transaction was named." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };

  const { error } = await supabase.from("transaction_reviews").upsert({
    transaction_id: id,
    flagged,
    flag_reason: flagged ? reason || "Flagged for review" : null,
    reviewed_by: auth.session.phone,
    reviewed_at: new Date().toISOString(),
  });
  if (error) return { error: `Could not update the flag: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: flagged ? "transaction.flag" : "transaction.unflag",
    targetType: "transaction",
    targetLabel: id,
    detail: { reason: flagged ? reason : undefined },
  });
  refresh();
  return { ok: true };
}

/* --------------------------------------------------------------- payments */

// Marks a payment refunded. Money movement happens with the card provider.
export async function adminRefundPaymentAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("payments.refund", "payment.refund");
  if ("error" in auth) return auth;

  const ref = String(formData.get("ref") ?? "");
  if (!ref) return { error: "No payment was named." };

  if (isSupabaseConfigured()) {
    const supabase = await db();
    if (!supabase) return { error: NO_KEY };
    const { error } = await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("ref", ref);
    if (error) return { error: `Could not update it: ${error.message}` };
  } else {
    await updateDemoPayment(ref, { status: "refunded" });
  }

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "payment.refund",
    targetType: "payment",
    targetLabel: ref,
  });
  refresh();
  return { ok: true };
}

/* ---------------------------------------------------------------- support */

export async function adminSetSupportStatusAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("support.manage", "support.status");
  if ("error" in auth) return auth;

  const ref = String(formData.get("ref") ?? "");
  const raw = String(formData.get("status") ?? "");
  const status =
    raw === "answered" || raw === "closed" || raw === "open" ? raw : null;
  if (!ref || !status) return { error: "Nothing to update." };

  if (isSupabaseConfigured()) {
    const supabase = await db();
    if (!supabase) return { error: NO_KEY };
    const { error } = await supabase
      .from("support_messages")
      .update({ status })
      .eq("ref", ref);
    if (error) return { error: `Could not update it: ${error.message}` };
  } else {
    await updateDemoSupport(ref, { status });
  }

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: `support.${status}`,
    targetType: "support",
    targetLabel: ref,
  });
  refresh();
  return { ok: true };
}

export async function adminReplySupportAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("support.manage", "support.reply");
  if ("error" in auth) return auth;

  const ref = String(formData.get("ref") ?? "");
  const body = String(formData.get("body") ?? "");
  const problem = validateSupportReply(body);
  if (!ref) return { error: "Nothing to reply to." };
  if (problem) return { error: problem };

  const label =
    auth.session.fullName?.trim() || "Customer service";

  if (isSupabaseConfigured()) {
    const supabase = await db();
    if (!supabase) return { error: NO_KEY };
    const { data: ticket } = await supabase
      .from("support_messages")
      .select("id")
      .eq("ref", ref)
      .maybeSingle();
    if (!ticket) return { error: "That conversation could not be found." };
    const { error } = await supabase.from("support_replies").insert({
      ticket_id: ticket.id,
      author_type: "staff",
      author_label: label,
      body: body.trim(),
    });
    if (error) return { error: `The reply could not be sent: ${error.message}` };
    await supabase
      .from("support_messages")
      .update({ status: "answered" })
      .eq("id", ticket.id);
  } else {
    await addDemoSupportReply(
      ref,
      {
        id: `SR-${Date.now().toString(36)}`,
        authorType: "staff",
        authorLabel: label,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      },
      "answered",
    );
  }

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "support.reply",
    targetType: "support",
    targetLabel: ref,
  });
  refresh();
  return { ok: true };
}

export async function adminSaveGoalAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("goals.manage", "goal.save");
  if ("error" in auth) return auth;

  const clientId = String(formData.get("clientId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount"));
  const currentAmount = Number(formData.get("currentAmount") || 0);
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!clientId || title.length < 2) {
    return { error: "Choose a client and give the goal a title." };
  }
  if (!(targetAmount > 0)) return { error: "Target amount must be greater than 0." };
  if (!targetDate) return { error: "Set a deadline." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };
  const { error } = await supabase.from("savings_goals").insert({
    user_id: clientId,
    title,
    target_amount: targetAmount,
    current_amount: Math.max(0, currentAmount),
    target_date: targetDate,
  });
  if (error) return { error: `Could not save the goal: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "goal.save",
    targetType: "goal",
    targetLabel: title,
    detail: { clientId },
  });
  refresh();
  return { ok: true };
}

export async function adminDeleteGoalAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("goals.manage", "goal.delete");
  if ("error" in auth) return auth;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Nothing to delete." };
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) return { error: `Could not delete the goal: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "goal.delete",
    targetType: "goal",
    targetLabel: id,
  });
  refresh();
  return { ok: true };
}

/* ------------------------------------------------------ team (founder only) */

export async function adminSaveTeamMemberAction(): Promise<Result> {
  const auth = await authorize("team.manage", "team.save");
  if ("error" in auth) return auth;
  return {
    error:
      "The control panel is locked to the founder. Extra staff cannot be given access.",
  };
}

export async function adminRemoveTeamMemberAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("team.manage", "team.remove");
  if ("error" in auth) return auth;

  const phone = canonicalPhone(String(formData.get("phone") ?? ""));
  if (phone === auth.session.phone) {
    return { error: "You cannot remove your own access." };
  }
  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };

  const supabase = await db();
  if (!supabase) return { error: NO_KEY };
  const { data: row } = await supabase
    .from("admin_users")
    .select("role")
    .eq("phone", phone)
    .maybeSingle();
  if (row?.role === "founder") {
    return { error: "The founder cannot be removed from here." };
  }

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("phone", phone);
  if (error) return { error: `Could not remove that admin: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "team.remove",
    targetType: "admin",
    targetLabel: phone,
  });
  refresh();
  return { ok: true };
}

/* -------------------------------------------------- settings (founder only) */

export async function adminSaveSettingsAction(
  formData: FormData,
): Promise<Result> {
  const auth = await authorize("settings.manage", "settings.save");
  if ("error" in auth) return auth;

  const patch = {
    maintenance_mode: formData.get("maintenanceMode") === "on",
    maintenance_message: String(formData.get("maintenanceMessage") ?? "").slice(
      0,
      500,
    ),
    announcement: String(formData.get("announcement") ?? "").slice(0, 500),
    announcement_active: formData.get("announcementActive") === "on",
    signups_enabled: formData.get("signupsEnabled") === "on",
    updated_by: auth.session.phone,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) return { error: DEMO_LIMIT };
  const supabase = await db();
  if (!supabase) return { error: NO_KEY };

  const { error } = await supabase
    .from("platform_settings")
    .update(patch)
    .eq("id", true);
  if (error) return { error: `Could not save settings: ${error.message}` };

  await recordAudit({
    actorPhone: auth.session.phone,
    actorRole: auth.session.role,
    action: "settings.save",
    targetType: "platform",
    detail: {
      maintenanceMode: patch.maintenance_mode,
      announcementActive: patch.announcement_active,
      signupsEnabled: patch.signups_enabled,
    },
  });
  revalidatePath("/", "layout");
  refresh();
  return { ok: true };
}
