import { adminPhones } from "@/lib/admin/access";
import { normalizeRole, type AdminRole } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { isSupabaseConfigured } from "@/lib/config";
import { readDemoAccounts } from "@/lib/demo/accounts";
import { readDemoPayments, readDemoSupport } from "@/lib/demo/ledger";
import { canonicalPhone } from "@/lib/phone";
import { PLANS, normalizePlan } from "@/lib/plans";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Plan } from "@/lib/types";

export type AdminClient = {
  id: string;
  phone: string;
  fullName: string;
  email: string;
  plan: Plan;
  createdAt: string | null;
  suspended: boolean;
  suspendedReason: string;
  transactionCount: number;
  income: number;
  expense: number;
  goalCount: number;
};

export type AdminTeamMember = {
  phone: string;
  fullName: string;
  role: AdminRole;
  createdBy: string;
  createdAt: string | null;
  bootstrapped: boolean;
};

export type AdminAuditEntry = {
  id: string;
  actorPhone: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetLabel: string;
  outcome: string;
  createdAt: string;
};

export type AdminTransaction = {
  id: string;
  clientId: string;
  phone: string;
  fullName: string;
  plan: Plan;
  categoryId: string;
  categoryName: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
  /** Who put the row there: the client, an admin correction, or a reversal. */
  origin: "client" | "admin" | "reversal";
  /** Set on a reversal row, pointing at the row it undoes. */
  reversesId: string | null;
  /** Set on a row that has since been reversed. */
  reversedById: string | null;
  createdBy: string;
  flagged: boolean;
  flagReason: string;
  note: string;
};

export type AdminCategory = {
  id: string;
  clientId: string;
  name: string;
  type: "income" | "expense";
};

export type AdminGoal = {
  id: string;
  clientId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
};

export type AdminPayment = {
  ref: string;
  phone: string | null;
  amountLabel: string;
  amount: number;
  cardLast4: string;
  status: string;
  createdAt: string;
};

export type AdminSupportReply = {
  id: string;
  authorType: "client" | "staff";
  authorLabel: string;
  body: string;
  createdAt: string;
};

export type AdminSupportItem = {
  id: string;
  userId: string;
  ref: string;
  phone: string;
  fullName: string;
  plan: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  callbackRequested: boolean;
  replies: AdminSupportReply[];
};

export type AdminBudget = {
  clientId: string;
  month: string;
  expenseLimit: number;
};

export type AdminSnapshot = {
  mode: "supabase" | "demo";
  clients: AdminClient[];
  transactions: AdminTransaction[];
  categories: AdminCategory[];
  goals: AdminGoal[];
  payments: AdminPayment[];
  support: AdminSupportItem[];
  budgets: AdminBudget[];
  notices: string[];
};

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  return isSupabaseConfigured() ? loadFromSupabase() : loadFromDemo();
}

// The admin team, with the ADMIN_PHONES founders merged in so the list shows
// everyone who can actually get in.
export async function loadAdminTeam(): Promise<AdminTeamMember[]> {
  const bootstrap: AdminTeamMember[] = adminPhones().map((phone) => ({
    phone,
    fullName: "Set in ADMIN_PHONES",
    role: "founder" as AdminRole,
    createdBy: "environment",
    createdAt: null,
    bootstrapped: true,
  }));

  if (!isSupabaseConfigured()) return bootstrap;
  const supabase = createAdminSupabase();
  if (!supabase) return bootstrap;

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: true });

  const stored: AdminTeamMember[] = (data ?? []).map((row) => ({
    phone: String(row.phone),
    fullName: String(row.full_name ?? row.phone),
    role: normalizeRole(row.role),
    createdBy: String(row.created_by ?? ""),
    createdAt: row.created_at ? String(row.created_at) : null,
    bootstrapped: false,
  }));

  const seen = new Set(stored.map((member) => member.phone));
  return [...stored, ...bootstrap.filter((m) => !seen.has(m.phone))];
}

export async function loadAuditTrail(limit = 100): Promise<AdminAuditEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createAdminSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    actorPhone: String(row.actor_phone ?? ""),
    actorRole: String(row.actor_role ?? ""),
    action: String(row.action ?? ""),
    targetType: String(row.target_type ?? ""),
    targetLabel: String(row.target_label ?? ""),
    outcome: String(row.outcome ?? "success"),
    createdAt: String(row.created_at ?? ""),
  }));
}

async function loadFromSupabase(): Promise<AdminSnapshot> {
  const supabase = createAdminSupabase();
  if (!supabase) {
    return {
      mode: "supabase",
      clients: [],
      transactions: [],
      categories: [],
      goals: [],
      payments: [],
      support: [],
      budgets: [],
      notices: [
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local. Without it the panel cannot read other clients' rows, because row level security limits each key to its own account.",
      ],
    };
  }

  const [profiles, categories, transactions, goals, payments, support, replies, reviews, budgets] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, user_id, name, type"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("savings_goals").select("*"),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("support_replies")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase.from("transaction_reviews").select("*"),
      supabase.from("monthly_budgets").select("*"),
    ]);

  const notices: string[] = [];
  for (const [label, result] of [
    ["profiles", profiles],
    ["categories", categories],
    ["transactions", transactions],
    ["savings goals", goals],
    ["payments", payments],
    ["support messages", support],
    ["support replies", replies],
    ["transaction reviews", reviews],
    ["monthly budgets", budgets],
  ] as const) {
    if (result.error) {
      notices.push(`Could not read ${label}: ${result.error.message}`);
    }
  }

  const categoryRows = categories.data ?? [];
  const categoryById = new Map(
    categoryRows.map((row) => [
      String(row.id),
      { name: String(row.name), type: row.type === "income" ? "income" : "expense" },
    ]),
  );

  const session = await getAdminSession();
  const selfPhone = session ? canonicalPhone(session.phone) : "";

  const clients: AdminClient[] = (profiles.data ?? [])
    .filter((row) => canonicalPhone(String(row.phone ?? "")) !== selfPhone)
    .map((row) => ({
      id: String(row.id),
      phone: String(row.phone ?? ""),
      fullName: String(row.full_name ?? row.phone ?? "Account"),
      email: String(row.email ?? ""),
      plan: normalizePlan(row.plan),
      createdAt: row.created_at ? String(row.created_at) : null,
      suspended: Boolean(row.suspended),
      suspendedReason: String(row.suspended_reason ?? ""),
      transactionCount: 0,
      income: 0,
      expense: 0,
      goalCount: 0,
    }));
  const profileById = new Map(
    (profiles.data ?? []).map((row) => [
      String(row.id),
      {
        phone: String(row.phone ?? ""),
        fullName: String(row.full_name ?? row.phone ?? "Client"),
      },
    ]),
  );

  const repliesByTicket = new Map<string, AdminSupportReply[]>();
  for (const row of replies.data ?? []) {
    const ticketId = String(row.ticket_id);
    const list = repliesByTicket.get(ticketId) ?? [];
    list.push({
      id: String(row.id),
      authorType: row.author_type === "staff" ? "staff" : "client",
      authorLabel: String(row.author_label ?? "Unknown"),
      body: String(row.body ?? ""),
      createdAt: String(row.created_at ?? ""),
    });
    repliesByTicket.set(ticketId, list);
  }

  const clientById = new Map(clients.map((client) => [client.id, client]));

  const allGoals: AdminGoal[] = (goals.data ?? []).map((row) => ({
    id: String(row.id),
    clientId: String(row.user_id),
    title: String(row.title ?? ""),
    targetAmount: Number(row.target_amount ?? 0),
    currentAmount: Number(row.current_amount ?? 0),
    targetDate: String(row.target_date ?? ""),
  }));

  for (const goal of allGoals) {
    const client = clientById.get(goal.clientId);
    if (client) client.goalCount += 1;
  }

  const reviewByTransaction = new Map(
    (reviews.data ?? []).map((row) => [
      String(row.transaction_id),
      {
        flagged: Boolean(row.flagged),
        flagReason: String(row.flag_reason ?? ""),
        note: String(row.note ?? ""),
      },
    ]),
  );

  // A row is "reversed" when another row points back at it.
  const reversalByTarget = new Map<string, string>();
  for (const row of transactions.data ?? []) {
    if (row.reverses_id) {
      reversalByTarget.set(String(row.reverses_id), String(row.id));
    }
  }

  const allTransactions: AdminTransaction[] = [];
  for (const row of transactions.data ?? []) {
    const client = clientById.get(String(row.user_id));
    const category = categoryById.get(String(row.category_id));
    const amount = Number(row.amount);
    const type = (category?.type ?? "expense") as "income" | "expense";
    const origin = normalizeOrigin(row.origin);
    const signed =
      (type === "income" ? amount : -amount) * (origin === "reversal" ? -1 : 1);
    if (client) {
      client.transactionCount += 1;
      if (signed >= 0) client.income += signed;
      else client.expense += -signed;
    }
    const review = reviewByTransaction.get(String(row.id));
    allTransactions.push({
      id: String(row.id),
      clientId: String(row.user_id),
      phone: client?.phone ?? "",
      fullName: client?.fullName ?? "Unknown",
      plan: client?.plan ?? "free",
      categoryId: String(row.category_id),
      categoryName: category?.name ?? "Uncategorised",
      type,
      amount,
      date: String(row.date),
      description: String(row.description ?? ""),
      origin,
      reversesId: row.reverses_id ? String(row.reverses_id) : null,
      reversedById: reversalByTarget.get(String(row.id)) ?? null,
      createdBy: String(row.created_by ?? ""),
      flagged: review?.flagged ?? false,
      flagReason: review?.flagReason ?? "",
      note: review?.note ?? "",
    });
  }

  return {
    mode: "supabase",
    clients,
    transactions: allTransactions,
    categories: categoryRows.map((row) => ({
      id: String(row.id),
      clientId: String(row.user_id),
      name: String(row.name),
      type: row.type === "income" ? ("income" as const) : ("expense" as const),
    })),
    goals: allGoals,
    payments: (payments.data ?? []).map((row) => ({
      ref: String(row.ref),
      phone: row.phone ? String(row.phone) : null,
      amountLabel: String(row.amount_label ?? ""),
      amount: Number(row.amount ?? 0),
      cardLast4: String(row.card_last4 ?? ""),
      status: String(row.status ?? "paid"),
      createdAt: String(row.created_at ?? ""),
    })),
    support: (support.data ?? []).map((row) => {
      const profile = profileById.get(String(row.user_id));
      return {
        id: String(row.id),
        userId: String(row.user_id),
        ref: String(row.ref),
        phone: profile?.phone ?? "",
        fullName: profile?.fullName ?? "Client",
        plan: String(row.plan ?? "free"),
        priority: String(row.priority ?? "standard"),
        subject: String(row.subject ?? ""),
        message: String(row.message ?? ""),
        status: String(row.status ?? "open"),
        createdAt: String(row.created_at ?? ""),
        callbackRequested: Boolean(row.callback_requested),
        replies: repliesByTicket.get(String(row.id)) ?? [],
      };
    }),
    budgets: (budgets.data ?? []).map((row) => ({
      clientId: String(row.user_id),
      month: String(row.month ?? ""),
      expenseLimit: Number(row.expense_limit ?? 0),
    })),
    notices,
  };
}

async function loadFromDemo(): Promise<AdminSnapshot> {
  const [accounts, payments, support] = await Promise.all([
    readDemoAccounts(),
    readDemoPayments(),
    readDemoSupport(),
  ]);

  const session = await getAdminSession();
  const selfPhone = session ? canonicalPhone(session.phone) : "";
  const clients: AdminClient[] = Object.entries(accounts)
    .filter(([phone]) => canonicalPhone(phone) !== selfPhone)
    .map(([phone, account]) => ({
      id: phone,
      phone,
      fullName: account.fullName,
      email: account.email,
      plan: normalizePlan(account.plan),
      createdAt: null,
      suspended: false,
      suspendedReason: "",
      transactionCount: 0,
      income: 0,
      expense: 0,
      goalCount: 0,
    }));

  return {
    mode: "demo",
    clients,
    transactions: [],
    categories: [],
    goals: [],
    payments: payments.map((row) => ({
      ref: row.ref,
      phone: row.phone,
      amountLabel: row.amount,
      amount: PLANS.premium.priceAmount,
      cardLast4: row.cardLast4,
      status: row.status,
      createdAt: row.paidAt,
    })),
    support: support.map((row) => ({
      id: row.ref,
      userId: row.phone,
      ref: row.ref,
      phone: row.phone,
      fullName: accounts[row.phone]?.fullName || row.phone,
      plan: row.plan,
      priority: row.priority,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      callbackRequested: row.callbackRequested,
      replies: row.replies ?? [],
    })),
    budgets: [],
    notices: [
      "No database is connected, so this panel only sees what this browser stored: accounts created here, plus payments and support requests. Client transactions stay in each client's own browser and cannot be listed or cancelled.",
      "Run supabase/schema.sql against a Supabase project and set the keys in .env.local to control every client from here.",
    ],
  };
}

export function summarise(snapshot: AdminSnapshot) {
  const premium = snapshot.clients.filter((c) => c.plan === "premium").length;
  const standard = snapshot.clients.length - premium;
  const suspended = snapshot.clients.filter((c) => c.suspended).length;
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newThisMonth = snapshot.clients.filter(
    (c) => c.createdAt && new Date(c.createdAt).getTime() >= since,
  ).length;
  const income = snapshot.clients.reduce((sum, c) => sum + c.income, 0);
  const expense = snapshot.clients.reduce((sum, c) => sum + c.expense, 0);
  const revenue = snapshot.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    clients: snapshot.clients.length,
    premium,
    standard,
    suspended,
    newThisMonth,
    refunded: snapshot.payments.filter((p) => p.status === "refunded").length,
    conversion: snapshot.clients.length
      ? Math.round((premium / snapshot.clients.length) * 100)
      : 0,
    income,
    expense,
    transactions: snapshot.transactions.length,
    revenue,
    monthlyRecurring: premium * PLANS.premium.priceAmount,
    openSupport: snapshot.support.filter((s) => s.status === "open").length,
    prioritySupport: snapshot.support.filter(
      (s) => s.status === "open" && s.priority === "priority",
    ).length,
    flagged: snapshot.transactions.filter((t) => t.flagged).length,
  };
}

function normalizeOrigin(value: unknown): AdminTransaction["origin"] {
  if (value === "admin" || value === "reversal") return value;
  return "client";
}
