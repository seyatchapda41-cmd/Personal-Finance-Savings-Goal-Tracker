import { currentMonthKey, monthKey } from "@/lib/format";
import type { Category, SavingsGoal, Transaction } from "@/lib/types";

export function categoryById(categories: Category[], id: string) {
  return categories.find((category) => category.id === id);
}

// Amounts are stored positive. Sign comes from the category, then flips when
// staff posted a reversal so the original and the reversal net to zero.
export function signedAmount(
  tx: Pick<Transaction, "amount" | "categoryId" | "origin">,
  categories: Category[],
) {
  const category = categoryById(categories, tx.categoryId);
  const direction =
    category?.type === "income" ? 1 : category?.type === "expense" ? -1 : 0;
  const flip = tx.origin === "reversal" ? -1 : 1;
  return tx.amount * direction * flip;
}

function fold(
  transactions: Transaction[],
  categories: Category[],
  include: (tx: Transaction) => boolean,
) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (!include(tx)) continue;
    const signed = signedAmount(tx, categories);
    if (signed >= 0) income += signed;
    else expense += -signed;
  }
  return { income, expense, net: income - expense };
}

export function monthTotals(
  transactions: Transaction[],
  categories: Category[],
  month = currentMonthKey(),
) {
  return fold(
    transactions,
    categories,
    (tx) => monthKey(tx.date) === month,
  );
}

export function monthlyHistory(
  transactions: Transaction[],
  categories: Category[],
  months = 12,
) {
  const end = currentMonthKey();
  const points: { month: string; label: string; income: number; expense: number }[] = [];
  const startDate = new Date(`${end}-01T00:00:00`);
  startDate.setMonth(startDate.getMonth() - (months - 1));
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const totals = monthTotals(transactions, categories, key);
    points.push({
      month: key,
      label: date.toLocaleString("en-US", { month: "short" }),
      income: totals.income,
      expense: totals.expense,
    });
  }
  return points;
}

export function expensesByCategoryName(
  transactions: Transaction[],
  categories: Category[],
  month = currentMonthKey(),
) {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (monthKey(tx.date) !== month) continue;
    const signed = signedAmount(tx, categories);
    if (signed >= 0) continue;
    const name = categoryById(categories, tx.categoryId)?.name ?? "Other";
    totals.set(name, (totals.get(name) ?? 0) + -signed);
  }
  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      share: total ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function allTimeBalance(
  transactions: Transaction[],
  categories: Category[],
) {
  return fold(transactions, categories, () => true);
}

export function goalProgress(goal: SavingsGoal) {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}
