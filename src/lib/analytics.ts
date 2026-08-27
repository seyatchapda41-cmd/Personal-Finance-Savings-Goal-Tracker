import { currentMonthKey, monthKey } from "@/lib/format";
import type { Category, SavingsGoal, Transaction } from "@/lib/types";

export function categoryById(categories: Category[], id: string) {
  return categories.find((category) => category.id === id);
}

export function monthTotals(
  transactions: Transaction[],
  categories: Category[],
  month = currentMonthKey(),
) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (monthKey(tx.date) !== month) continue;
    const category = categoryById(categories, tx.categoryId);
    if (category?.type === "income") income += tx.amount;
    if (category?.type === "expense") expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

export function allTimeBalance(
  transactions: Transaction[],
  categories: Category[],
) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const category = categoryById(categories, tx.categoryId);
    if (category?.type === "income") income += tx.amount;
    if (category?.type === "expense") expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

export function goalProgress(goal: SavingsGoal) {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}
