import { cookies } from "next/headers";
import { isLoginEmail } from "@/lib/auth/phone-identity";
import { isSupabaseConfigured } from "@/lib/config";
import { normalizePhone } from "@/lib/phone";
import { normalizePlan } from "@/lib/plans";
import { DEMO_SESSION_COOKIE, RESET_BOOKS_COOKIE } from "@/lib/supabase/middleware";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row } = await supabase
      .from("profiles")
      .select("phone, email, full_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    const phone = normalizePhone(
      row?.phone ||
        (user.user_metadata?.phone as string | undefined) ||
        user.phone ||
        "",
    );
    const email =
      (row?.email as string | undefined) ||
      (user.user_metadata?.email as string | undefined) ||
      (isLoginEmail(user.email) ? "" : (user.email ?? ""));
    return {
      id: user.id,
      email,
      phone,
      fullName:
        (row?.full_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        phone ||
        "Account",
      plan: normalizePlan(row?.plan ?? user.user_metadata?.plan),
    };
  }

  const store = await cookies();
  const raw = store.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      id: string;
      email?: string;
      phone?: string;
      fullName?: string;
      plan?: string;
    };
    if (!parsed.phone) return null;
    return {
      id: parsed.id,
      email: parsed.email ?? "",
      phone: parsed.phone,
      fullName: parsed.fullName || parsed.phone,
      plan: normalizePlan(parsed.plan),
    };
  } catch {
    return null;
  }
}

// Read only: a cookie cannot be deleted while a page renders, so the browser
// clears this one after the reset has been applied.
export async function readResetBooksFlag() {
  const store = await cookies();
  return store.get(RESET_BOOKS_COOKIE)?.value === "1";
}
