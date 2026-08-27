"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { allTimeBalance, monthTotals } from "@/lib/analytics";
import { isSupabaseConfigured } from "@/lib/config";
import { RESET_BOOKS_COOKIE } from "@/lib/cookie-names";
import { loadSnapshot, resetSnapshot, saveSnapshot } from "@/lib/demo/storage";
import { monthKey } from "@/lib/format";
import { createId } from "@/lib/ids";
import { limitMessage, limitsFor, type PlanLimits } from "@/lib/plans";
import { seedCategories } from "@/lib/seed";
import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  CategoryType,
  FinanceSnapshot,
  Plan,
  Profile,
  SavingsGoal,
  Transaction,
} from "@/lib/types";

type FinanceContextValue = {
  ready: boolean;
  usingSupabase: boolean;
  snapshot: FinanceSnapshot;
  month: ReturnType<typeof monthTotals>;
  balance: ReturnType<typeof allTimeBalance>;
  plan: Plan;
  limits: PlanLimits;
  monthlyTransactionCount: number;
  addCategory: (name: string, type: CategoryType) => Promise<string | null>;
  updateCategory: (id: string, name: string, type: CategoryType) => Promise<string | null>;
  deleteCategory: (id: string) => Promise<string | null>;
  addTransaction: (input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
  }) => Promise<string | null>;
  updateTransaction: (
    id: string,
    input: {
      categoryId: string;
      amount: number;
      date: string;
      description: string;
    },
  ) => Promise<string | null>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (input: {
    title: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
  }) => Promise<string | null>;
  updateGoal: (
    id: string,
    input: {
      title: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
    },
  ) => Promise<string | null>;
  deleteGoal: (id: string) => Promise<void>;
  updateProfileName: (fullName: string) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function clearResetBooksFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${RESET_BOOKS_COOKIE}=; Max-Age=0; path=/`;
}

export function FinanceProvider({
  profile,
  resetBooks = false,
  children,
}: {
  profile: Profile;
  resetBooks?: boolean;
  children: React.ReactNode;
}) {
  const usingSupabase = isSupabaseConfigured();
  const [snapshot, setSnapshot] = useState<FinanceSnapshot>({
    profile,
    categories: [],
    transactions: [],
    goals: [],
  });
  const [ready, setReady] = useState(false);

  const persist = useCallback(
    (next: FinanceSnapshot) => {
      setSnapshot(next);
      if (!usingSupabase) saveSnapshot(next);
    },
    [usingSupabase],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!usingSupabase) {
        const local = resetBooks ? resetSnapshot(profile) : loadSnapshot(profile);
        if (!cancelled) {
          setSnapshot({ ...local, profile });
          setReady(true);
        }
        return;
      }

      const supabase = createClient();
      const [categories, transactions, goals] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", profile.id),
        supabase.from("transactions").select("*").eq("user_id", profile.id),
        supabase.from("savings_goals").select("*").eq("user_id", profile.id),
      ]);

      let cats = (categories.data ?? []).map(mapCategory);
      if (cats.length === 0) {
        const seeded = seedCategories(profile.id).map((c) => ({
          user_id: c.userId,
          name: c.name,
          type: c.type,
        }));
        await supabase.from("categories").insert(seeded);
        const again = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", profile.id);
        cats = (again.data ?? []).map(mapCategory);
      }

      if (!cancelled) {
        setSnapshot({
          profile,
          categories: cats,
          transactions: (transactions.data ?? []).map(mapTransaction),
          goals: (goals.data ?? []).map(mapGoal),
        });
        setReady(true);
      }
    }

    void load();
    // The flag has been acted on, so drop it here; a server render cannot.
    if (resetBooks) clearResetBooksFlag();
    return () => {
      cancelled = true;
    };
  }, [profile, resetBooks, usingSupabase]);

  const value = useMemo<FinanceContextValue>(() => {
    const month = monthTotals(snapshot.transactions, snapshot.categories);
    const balance = allTimeBalance(snapshot.transactions, snapshot.categories);
    const plan = snapshot.profile.plan;
    const limits = limitsFor(plan);
    const countInMonth = (isoDate: string) =>
      snapshot.transactions.filter((t) => monthKey(t.date) === monthKey(isoDate))
        .length;

    return {
      ready,
      usingSupabase,
      snapshot,
      month,
      balance,
      plan,
      limits,
      monthlyTransactionCount: snapshot.transactions.filter(
        (t) => monthKey(t.date) === monthKey(new Date().toISOString().slice(0, 10)),
      ).length,
      async addCategory(name, type) {
        const trimmed = name.trim();
        if (!trimmed) return "Enter a category name.";
        if (
          snapshot.categories.some(
            (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
          )
        ) {
          return "That category already exists.";
        }
        if (
          limits.categories !== null &&
          snapshot.categories.length >= limits.categories
        ) {
          return limitMessage("categories", limits.categories, plan);
        }
        if (usingSupabase) {
          const supabase = createClient();
          const { error } = await supabase.from("categories").insert({
            user_id: profile.id,
            name: trimmed,
            type,
          });
          if (error) return error.message;
          const { data } = await supabase
            .from("categories")
            .select("*")
            .eq("user_id", profile.id);
          setSnapshot((s) => ({ ...s, categories: (data ?? []).map(mapCategory) }));
          return null;
        }
        persist({
          ...snapshot,
          categories: [
            ...snapshot.categories,
            { id: createId("cat"), userId: profile.id, name: trimmed, type },
          ],
        });
        return null;
      },
      async updateCategory(id, name, type) {
        const trimmed = name.trim();
        if (!trimmed) return "Enter a category name.";
        if (usingSupabase) {
          const supabase = createClient();
          const { error } = await supabase
            .from("categories")
            .update({ name: trimmed, type })
            .eq("id", id);
          if (error) return error.message;
        }
        persist({
          ...snapshot,
          categories: snapshot.categories.map((c) =>
            c.id === id ? { ...c, name: trimmed, type } : c,
          ),
        });
        return null;
      },
      async deleteCategory(id) {
        if (snapshot.transactions.some((t) => t.categoryId === id)) {
          return "Reassign or delete transactions in this category first.";
        }
        if (usingSupabase) {
          const supabase = createClient();
          const { error } = await supabase.from("categories").delete().eq("id", id);
          if (error) return error.message;
        }
        persist({
          ...snapshot,
          categories: snapshot.categories.filter((c) => c.id !== id),
        });
        return null;
      },
      async addTransaction(input) {
        const amount = Number(input.amount);
        if (!input.categoryId) return "Choose a category.";
        if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than 0.";
        if (!input.date) return "Choose a date.";
        if (
          limits.monthlyTransactions !== null &&
          countInMonth(input.date) >= limits.monthlyTransactions
        ) {
          return limitMessage("transactions", limits.monthlyTransactions, plan);
        }
        const row: Transaction = {
          id: createId("tx"),
          userId: profile.id,
          categoryId: input.categoryId,
          amount,
          date: input.date,
          description: input.description.trim(),
        };
        if (usingSupabase) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("transactions")
            .insert({
              user_id: profile.id,
              category_id: row.categoryId,
              amount: row.amount,
              date: row.date,
              description: row.description,
            })
            .select("*")
            .single();
          if (error) return error.message;
          persist({
            ...snapshot,
            transactions: [mapTransaction(data), ...snapshot.transactions],
          });
          return null;
        }
        persist({ ...snapshot, transactions: [row, ...snapshot.transactions] });
        return null;
      },
      async updateTransaction(id, input) {
        const amount = Number(input.amount);
        if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than 0.";
        if (usingSupabase) {
          const supabase = createClient();
          const { error } = await supabase
            .from("transactions")
            .update({
              category_id: input.categoryId,
              amount,
              date: input.date,
              description: input.description.trim(),
            })
            .eq("id", id);
          if (error) return error.message;
        }
        persist({
          ...snapshot,
          transactions: snapshot.transactions.map((t) =>
            t.id === id
              ? {
                  ...t,
                  categoryId: input.categoryId,
                  amount,
                  date: input.date,
                  description: input.description.trim(),
                }
              : t,
          ),
        });
        return null;
      },
      async deleteTransaction(id) {
        if (usingSupabase) {
          const supabase = createClient();
          await supabase.from("transactions").delete().eq("id", id);
        }
        persist({
          ...snapshot,
          transactions: snapshot.transactions.filter((t) => t.id !== id),
        });
      },
      async addGoal(input) {
        if (!input.title.trim()) return "Enter a goal title.";
        if (input.targetAmount <= 0) return "Target amount must be greater than 0.";
        if (limits.goals !== null && snapshot.goals.length >= limits.goals) {
          return limitMessage("goals", limits.goals, plan);
        }
        const row: SavingsGoal = {
          id: createId("goal"),
          userId: profile.id,
          title: input.title.trim(),
          targetAmount: input.targetAmount,
          currentAmount: Math.max(0, input.currentAmount),
          targetDate: input.targetDate,
        };
        if (usingSupabase) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("savings_goals")
            .insert({
              user_id: profile.id,
              title: row.title,
              target_amount: row.targetAmount,
              current_amount: row.currentAmount,
              target_date: row.targetDate,
            })
            .select("*")
            .single();
          if (error) return error.message;
          persist({ ...snapshot, goals: [mapGoal(data), ...snapshot.goals] });
          return null;
        }
        persist({ ...snapshot, goals: [row, ...snapshot.goals] });
        return null;
      },
      async updateGoal(id, input) {
        if (!input.title.trim()) return "Enter a goal title.";
        if (usingSupabase) {
          const supabase = createClient();
          const { error } = await supabase
            .from("savings_goals")
            .update({
              title: input.title.trim(),
              target_amount: input.targetAmount,
              current_amount: input.currentAmount,
              target_date: input.targetDate,
            })
            .eq("id", id);
          if (error) return error.message;
        }
        persist({
          ...snapshot,
          goals: snapshot.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: input.title.trim(),
                  targetAmount: input.targetAmount,
                  currentAmount: input.currentAmount,
                  targetDate: input.targetDate,
                }
              : g,
          ),
        });
        return null;
      },
      async deleteGoal(id) {
        if (usingSupabase) {
          const supabase = createClient();
          await supabase.from("savings_goals").delete().eq("id", id);
        }
        persist({ ...snapshot, goals: snapshot.goals.filter((g) => g.id !== id) });
      },
      async updateProfileName(fullName) {
        const nextName = fullName.trim();
        persist({ ...snapshot, profile: { ...snapshot.profile, fullName: nextName } });
        if (usingSupabase) {
          const supabase = createClient();
          await supabase.from("profiles").update({ full_name: nextName }).eq("id", profile.id);
        }
      },
    };
  }, [persist, profile.id, ready, snapshot, usingSupabase]);

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    type: row.type === "income" ? "income" : "expense",
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    categoryId: String(row.category_id),
    amount: Number(row.amount),
    date: String(row.date),
    description: String(row.description ?? ""),
  };
}

function mapGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    targetDate: String(row.target_date),
  };
}
