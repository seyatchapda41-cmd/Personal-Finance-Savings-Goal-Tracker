"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { currentMonthKey } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export async function readMonthlyBudgetAction(
  month = currentMonthKey(),
): Promise<number> {
  const profile = await getCurrentProfile();
  if (!profile) return 0;
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createServerSupabase();
  if (!supabase) return 0;
  const { data } = await supabase
    .from("monthly_budgets")
    .select("expense_limit")
    .eq("user_id", profile.id)
    .eq("month", month)
    .maybeSingle();
  return Number(data?.expense_limit ?? 0);
}

export async function saveMonthlyBudgetAction(formData: FormData): Promise<{
  error?: string;
  ok?: true;
}> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." };
  const month = String(formData.get("month") ?? currentMonthKey());
  const amount = Number(formData.get("expenseLimit"));
  if (!(amount >= 0)) return { error: "Enter a budget of 0 or more." };

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const { error } = await supabase.from("monthly_budgets").upsert(
      {
        user_id: profile.id,
        month,
        expense_limit: amount,
      },
      { onConflict: "user_id,month" },
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/app/budget");
  return { ok: true };
}
