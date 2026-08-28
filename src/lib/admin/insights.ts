import type { AdminClient, AdminGoal, AdminSnapshot, AdminTransaction } from "@/lib/admin/data";
import { currentMonthKey, monthKey, todayIso } from "@/lib/format";

export const RANGE_OPTIONS = [
  { value: "this-month", label: "This month" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["value"];

export function parseRange(value: string | undefined): RangeKey {
  return RANGE_OPTIONS.some((option) => option.value === value)
    ? (value as RangeKey)
    : "this-month";
}

export function signedAdminAmount(row: AdminTransaction) {
  const direction = row.type === "income" ? 1 : -1;
  const flip = row.origin === "reversal" ? -1 : 1;
  return row.amount * direction * flip;
}

export function shiftDays(iso: string, days: number) {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftMonths(month: string, count: number) {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 1 + count, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodBounds(range: RangeKey) {
  const to = todayIso();
  if (range === "all") return { from: null as string | null, to, label: "All time" };
  if (range === "this-month") {
    const month = currentMonthKey();
    return { from: `${month}-01`, to, label: "This month" };
  }
  if (range === "30d") return { from: shiftDays(to, -29), to, label: "Last 30 days" };
  if (range === "90d") return { from: shiftDays(to, -89), to, label: "Last 90 days" };
  return { from: `${shiftMonths(currentMonthKey(), -11)}-01`, to, label: "Last 12 months" };
}

export function inPeriod(date: string, range: RangeKey) {
  const { from, to } = periodBounds(range);
  if (from && date < from) return false;
  return date <= to;
}

export function foldTransactions(rows: AdminTransaction[]) {
  let income = 0;
  let expense = 0;
  for (const row of rows) {
    const signed = signedAdminAmount(row);
    if (signed >= 0) income += signed;
    else expense += -signed;
  }
  return { income, expense, profit: income - expense };
}

const FIXED_MARKERS = [
  "housing",
  "rent",
  "mortgage",
  "utilities",
  "insurance",
  "subscription",
  "loan",
  "internet",
  "phone",
  "salary",
];

export function isFixedCategory(name: string) {
  const lower = name.toLowerCase();
  return FIXED_MARKERS.some((marker) => lower.includes(marker));
}

export type MonthlyPoint = {
  month: string;
  label: string;
  income: number;
  expense: number;
  profit: number;
};

export function monthlySeries(rows: AdminTransaction[], range: RangeKey): MonthlyPoint[] {
  const { from, to } = periodBounds(range);
  const startMonth = from ? monthKey(from) : oldestMonth(rows) ?? currentMonthKey();
  const endMonth = monthKey(to);
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const row of rows) {
    if (!inPeriod(row.date, range)) continue;
    const key = monthKey(row.date);
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    const signed = signedAdminAmount(row);
    if (signed >= 0) bucket.income += signed;
    else bucket.expense += -signed;
    byMonth.set(key, bucket);
  }
  const points: MonthlyPoint[] = [];
  for (let month = startMonth; month <= endMonth; month = shiftMonths(month, 1)) {
    const bucket = byMonth.get(month) ?? { income: 0, expense: 0 };
    points.push({
      month,
      label: formatMonthLabel(month),
      income: bucket.income,
      expense: bucket.expense,
      profit: bucket.income - bucket.expense,
    });
    if (month === endMonth) break;
    if (points.length > 24) break;
  }
  return points;
}

function oldestMonth(rows: AdminTransaction[]) {
  if (rows.length === 0) return null;
  return rows.reduce((min, row) => (row.date < min ? row.date : min), rows[0].date).slice(0, 7);
}

export function formatMonthLabel(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export type CategorySlice = {
  name: string;
  amount: number;
  share: number;
  fixed: boolean;
};

export function expensesByCategory(rows: AdminTransaction[]): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const signed = signedAdminAmount(row);
    if (signed >= 0) continue;
    const name = row.categoryName || "Uncategorised";
    totals.set(name, (totals.get(name) ?? 0) + -signed);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      share: total ? (amount / total) * 100 : 0,
      fixed: isFixedCategory(name),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function costSplit(slices: CategorySlice[]) {
  let fixed = 0;
  let variable = 0;
  for (const slice of slices) {
    if (slice.fixed) fixed += slice.amount;
    else variable += slice.amount;
  }
  return { fixed, variable, total: fixed + variable };
}

export function previousPeriodRows(rows: AdminTransaction[], range: RangeKey) {
  if (range === "all") return [];
  const { from, to } = periodBounds(range);
  if (!from) return [];
  const days =
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) /
      86400000 +
    1;
  const prevTo = shiftDays(from, -1);
  const prevFrom = shiftDays(prevTo, -(days - 1));
  return rows.filter((row) => row.date >= prevFrom && row.date <= prevTo);
}

export type Forecast = {
  nextIncome: number;
  nextExpense: number;
  nextProfit: number;
};

export function forecastNextMonth(series: MonthlyPoint[]): Forecast {
  const recent = series.slice(-3);
  if (recent.length === 0) {
    return { nextIncome: 0, nextExpense: 0, nextProfit: 0 };
  }
  const nextIncome =
    recent.reduce((sum, point) => sum + point.income, 0) / recent.length;
  const nextExpense =
    recent.reduce((sum, point) => sum + point.expense, 0) / recent.length;
  return {
    nextIncome,
    nextExpense,
    nextProfit: nextIncome - nextExpense,
  };
}

export type GoalInsight = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  progress: number;
  targetDate: string;
  dueSoon: boolean;
  overdue: boolean;
};

export function goalInsights(
  goals: AdminGoal[],
  clients: AdminClient[],
): GoalInsight[] {
  const byId = new Map(clients.map((client) => [client.id, client]));
  const today = todayIso();
  const soon = shiftDays(today, 14);
  return goals
    .map((goal) => {
      const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
      const progress =
        goal.targetAmount > 0
          ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
          : 0;
      return {
        id: goal.id,
        clientId: goal.clientId,
        clientName: byId.get(goal.clientId)?.fullName ?? "Client",
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        remaining,
        progress,
        targetDate: goal.targetDate,
        dueSoon: goal.targetDate >= today && goal.targetDate <= soon && progress < 100,
        overdue: goal.targetDate < today && progress < 100,
      };
    })
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}

export type PlatformAlert = {
  id: string;
  tone: "warn" | "bad" | "good" | "neutral";
  title: string;
  detail: string;
  href?: string;
};

export function buildAlerts(
  snapshot: AdminSnapshot,
  range: RangeKey,
): PlatformAlert[] {
  const alerts: PlatformAlert[] = [];
  const periodRows = snapshot.transactions.filter((row) => inPeriod(row.date, range));
  const current = foldTransactions(periodRows);
  const previous = foldTransactions(previousPeriodRows(snapshot.transactions, range));
  const goals = goalInsights(snapshot.goals, snapshot.clients);

  if (previous.expense > 0 && current.expense > previous.expense * 1.1) {
    const extra = current.expense - previous.expense;
    alerts.push({
      id: "budget-over",
      tone: "bad",
      title: "Spending above the previous period",
      detail: `Expenses are ${Math.round((extra / previous.expense) * 100)}% higher than the last comparable window.`,
      href: "/admin/finance",
    });
  }

  for (const goal of goals.filter((item) => item.progress >= 80 && item.progress < 100)) {
    alerts.push({
      id: `goal-near-${goal.id}`,
      tone: "good",
      title: `${goal.clientName} is close to “${goal.title}”`,
      detail: `${Math.round(goal.progress)}% saved · ${goal.remaining.toFixed(2)} left.`,
      href: `/admin/goals`,
    });
  }

  for (const goal of goals.filter((item) => item.dueSoon).slice(0, 4)) {
    alerts.push({
      id: `goal-due-${goal.id}`,
      tone: "warn",
      title: `Deadline soon: ${goal.title}`,
      detail: `${goal.clientName} · due ${goal.targetDate}`,
      href: "/admin/goals",
    });
  }

  const expenses = periodRows.filter((row) => signedAdminAmount(row) < 0);
  if (expenses.length >= 4) {
    const amounts = expenses.map((row) => -signedAdminAmount(row)).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)] ?? 0;
    const unusual = expenses.filter((row) => -signedAdminAmount(row) > median * 3);
    for (const row of unusual.slice(0, 3)) {
      alerts.push({
        id: `unusual-${row.id}`,
        tone: "warn",
        title: "Unusual expense",
        detail: `${row.fullName} · ${row.categoryName} · ${row.date}`,
        href: `/admin/clients/${row.clientId}`,
      });
    }
  }

  for (const client of snapshot.clients.filter((c) => c.income - c.expense < 0).slice(0, 4)) {
    alerts.push({
      id: `low-${client.id}`,
      tone: "bad",
      title: `Low balance: ${client.fullName}`,
      detail: "All-time expenses exceed income on this account.",
      href: `/admin/clients/${client.id}`,
    });
  }

  const staffRecent = snapshot.transactions.filter(
    (row) =>
      (row.origin === "admin" || row.origin === "reversal") &&
      row.date >= shiftDays(todayIso(), -7),
  );
  if (staffRecent.length > 0) {
    alerts.push({
      id: "staff-tx",
      tone: "neutral",
      title: `${staffRecent.length} staff change${staffRecent.length === 1 ? "" : "s"} in 7 days`,
      detail: "Corrections or reversals posted from this panel.",
      href: "/admin/transactions",
    });
  }

  const openSupport = snapshot.support.filter((item) => item.status === "open").length;
  if (openSupport > 0) {
    alerts.push({
      id: "support",
      tone: "warn",
      title: `${openSupport} open conversation${openSupport === 1 ? "" : "s"}`,
      detail: "Clients are waiting on customer service.",
      href: "/admin/support",
    });
  }

  const flagged = snapshot.transactions.filter((row) => row.flagged).length;
  if (flagged > 0) {
    alerts.push({
      id: "flagged",
      tone: "warn",
      title: `${flagged} flagged record${flagged === 1 ? "" : "s"}`,
      detail: "Review these before they sit in the books.",
      href: "/admin/transactions",
    });
  }

  return alerts.slice(0, 12);
}

export function rangeHref(pathname: string, range: RangeKey) {
  return `${pathname}?range=${range}`;
}
