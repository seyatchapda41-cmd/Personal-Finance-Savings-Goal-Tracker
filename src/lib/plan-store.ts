import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/config";
import { writeDemoAccount } from "@/lib/demo/accounts";
import { rememberAccount } from "@/lib/known-accounts-server";
import { DEMO_SESSION_COOKIE } from "@/lib/supabase/middleware";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

// Moves the signed-in account onto a plan, in Supabase or in the demo cookie.
export async function applyPlanToCurrentUser(
  plan: Plan,
): Promise<{ error: string } | { ok: true }> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You are not signed in." };
    const { error } = await supabase.auth.updateUser({ data: { plan } });
    if (error) return { error: error.message };
    await supabase.from("profiles").update({ plan }).eq("id", user.id);
    const phone =
      (user.user_metadata?.phone as string | undefined) || user.phone;
    if (phone) {
      await rememberAccount({
        phone,
        fullName:
          (user.user_metadata?.full_name as string | undefined) || phone,
        plan,
      });
    }
    revalidatePath("/app", "layout");
    return { ok: true };
  }

  const store = await cookies();
  const raw = store.get(DEMO_SESSION_COOKIE)?.value;
  if (!raw) return { error: "You are not signed in." };
  let session: {
    id: string;
    phone: string;
    email: string;
    fullName: string;
  };
  try {
    session = JSON.parse(raw);
  } catch {
    return { error: "Your session could not be read. Log in again." };
  }
  store.set(DEMO_SESSION_COOKIE, JSON.stringify({ ...session, plan }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  await writeDemoAccount(session.phone, {
    email: session.email,
    fullName: session.fullName,
    plan,
  });
  await rememberAccount({
    phone: session.phone,
    fullName: session.fullName,
    plan,
  });
  revalidatePath("/app", "layout");
  return { ok: true };
}
