import type { Category, FinanceSnapshot, Profile } from "@/lib/types";
import { createId } from "@/lib/ids";

const INCOME = ["Salary", "Freelance", "Other income"];
const EXPENSE = [
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Health",
  "Shopping",
  "Entertainment",
  "Other expense",
];

export function seedCategories(userId: string): Category[] {
  return [
    ...INCOME.map((name) => ({
      id: createId("cat"),
      userId,
      name,
      type: "income" as const,
    })),
    ...EXPENSE.map((name) => ({
      id: createId("cat"),
      userId,
      name,
      type: "expense" as const,
    })),
  ];
}

export function emptySnapshot(profile: Profile): FinanceSnapshot {
  return {
    profile,
    categories: seedCategories(profile.id),
    transactions: [],
    goals: [],
  };
}
