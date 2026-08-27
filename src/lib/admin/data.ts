import { isSupabaseConfigured } from "@/lib/config";
import { readDemoAccounts } from "@/lib/demo/accounts";
import { readDemoPayments, readDemoSupport } from "@/lib/demo/ledger";
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
  transactionCount: number;
  income: number;
  expense: number;
  goalCount: number;
};

export type AdminTransaction = {
  id: string;
  phone: string;
  fullName: string;
  categoryName: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  description: string;
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

export type AdminSupportItem = {
  ref: string;
  phone: string;
  plan: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  callbackRequested: boolean;
};

export type AdminSnapshot = {
  mode: "supabase" | "demo";
  clients: AdminClient[];
  transactions: AdminTransaction[];
  payments: AdminPayment[];
  support: AdminSupportItem[];
  notices: string[];
};

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
  return isSupabaseConfigured() ? loadFromSupabase() : loadFromDemo();
}

async function loadFromSupabase(): Promise<AdminSnapshot> {
  const supabase = createAdminSupabase();
  if (!supabase) {
    return {
      mode: "supabase",
      clients: [],
      transactions: [],
      payments: [],
      support: [],
      notices: [
        "Set SUPABASE_SERVICE_ROLE_KEY in .env.local. Without it the panel cannot read other clients' rows, because row level security limits each key to its own account.",
      ],
    };
  }

  const [profiles, categories, transactions, goals, payments, support] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, user_id, name, type"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("savings_goals").select("id, user_id"),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const notices: string[] = [];
  for (const [label, result] of [
    ["profiles", profiles],
    ["categories", categories],
    ["transactions", transactions],
    ["savings goals", goals],
    ["payments", payments],
    ["support messages", support],
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

  const clients: AdminClient[] = (profiles.data ?? []).map((row) => ({
    id: String(row.id),
    phone: String(row.phone ?? ""),
    fullName: String(row.full_name ?? row.phone ?? "Account"),
    email: String(row.email ?? ""),
    plan: normalizePlan(row.plan),
    createdAt: row.created_at ? String(row.created_at) : null,
    transactionCount: 0,
    income: 0,
    expense: 0,
    goalCount: 0,
  }));
  const clientById = new Map(clients.map((client) => [client.id, client]));

  for (const row of goals.data ?? []) {
    const client = clientById.get(String(row.user_id));
    if (client) client.goalCount += 1;
  }

  const allTransactions: AdminTransaction[] = [];
  for (const row of transactions.data ?? []) {
    const client = clientById.get(String(row.user_id));
    const category = categoryById.get(String(row.category_id));
    const amount = Number(row.amount);
    const type = (category?.type ?? "expense") as "income" | "expense";
    if (client) {
      client.transactionCount += 1;
      if (type === "income") client.income += amount;
      else client.expense += amount;
    }
    allTransactions.push({
      id: String(row.id),
      phone: client?.phone ?? "",
      fullName: client?.fullName ?? "Unknown",
      categoryName: category?.name ?? "Uncategorised",
      type,
      amount,
      date: String(row.date),
      description: String(row.description ?? ""),
    });
  }

  return {
    mode: "supabase",
    clients,
    transactions: allTransactions,
    payments: (payments.data ?? []).map((row) => ({
      ref: String(row.ref),
      phone: row.phone ? String(row.phone) : null,
      amountLabel: String(row.amount_label ?? ""),
      amount: Number(row.amount ?? 0),
      cardLast4: String(row.card_last4 ?? ""),
      status: String(row.status ?? "paid"),
      createdAt: String(row.created_at ?? ""),
    })),
    support: (support.data ?? []).map((row) => ({
      ref: String(row.ref),
      phone: clientById.get(String(row.user_id))?.phone ?? "",
      plan: String(row.plan ?? "free"),
      priority: String(row.priority ?? "standard"),
      subject: String(row.subject ?? ""),
      message: String(row.message ?? ""),
      status: String(row.status ?? "open"),
      createdAt: String(row.created_at ?? ""),
      callbackRequested: Boolean(row.callback_requested),
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

  const clients: AdminClient[] = Object.entries(accounts).map(
    ([phone, account]) => ({
      id: phone,
      phone,
      fullName: account.fullName,
      email: account.email,
      plan: normalizePlan(account.plan),
      createdAt: null,
      transactionCount: 0,
      income: 0,
      expense: 0,
      goalCount: 0,
    }),
  );

  return {
    mode: "demo",
    clients,
    transactions: [],
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
      ref: row.ref,
      phone: row.phone,
      plan: row.plan,
      priority: row.priority,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      callbackRequested: row.callbackRequested,
    })),
    notices: [
      "No database is connected, so this panel only sees what this browser stored: accounts created here, plus payments and support requests. Client transactions stay in each client's own browser and cannot be listed or cancelled.",
      "Run supabase/schema.sql against a Supabase project and set the keys in .env.local to control every client from here.",
    ],
  };
}

export function summarise(snapshot: AdminSnapshot) {
  const premium = snapshot.clients.filter((c) => c.plan === "premium").length;
  const standard = snapshot.clients.length - premium;
  const income = snapshot.clients.reduce((sum, c) => sum + c.income, 0);
  const expense = snapshot.clients.reduce((sum, c) => sum + c.expense, 0);
  const revenue = snapshot.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    clients: snapshot.clients.length,
    premium,
    standard,
    income,
    expense,
    transactions: snapshot.transactions.length,
    revenue,
    monthlyRecurring: premium * PLANS.premium.priceAmount,
    openSupport: snapshot.support.filter((s) => s.status === "open").length,
    prioritySupport: snapshot.support.filter(
      (s) => s.status === "open" && s.priority === "priority",
    ).length,
  };
}
