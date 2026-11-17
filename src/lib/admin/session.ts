import { cache } from "react";
import { adminPhones, isAdminPhone } from "@/lib/admin/access";
import type { AdminRole } from "@/lib/admin/rbac";
import { getCurrentProfile } from "@/lib/auth/profile";
import { canonicalPhone } from "@/lib/phone";
import { createAdminSupabase } from "@/lib/supabase/admin";

export type AdminSession = {
  userId: string;
  phone: string;
  fullName: string;
  role: AdminRole;
  bootstrapped: boolean;
};

// The panel is founder-only. Founders come from ADMIN_PHONES when that list
// is set, otherwise from the founder row in admin_users. Moderators cannot
// open the panel, and extra founder seats are not created from the team page.
export async function ownerPhones(): Promise<string[]> {
  const fromEnv = adminPhones();
  if (fromEnv.length > 0) return fromEnv;

  const supabase = createAdminSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("admin_users")
    .select("phone")
    .eq("role", "founder");
  return (data ?? [])
    .map((row) => canonicalPhone(String(row.phone ?? "")))
    .filter(Boolean);
}

export async function isOwnerPhone(phone: string) {
  const allowed = await ownerPhones();
  return allowed.includes(canonicalPhone(phone));
}

export async function resolveAdminRole(
  phone: string,
): Promise<{ role: AdminRole; bootstrapped: boolean } | null> {
  const normalized = canonicalPhone(phone);
  if (!normalized) return null;
  if (await isOwnerPhone(normalized)) {
    return { role: "founder", bootstrapped: isAdminPhone(normalized) };
  }

  return null;
}

export async function founderSeatOpen() {
  return (await ownerPhones()).length === 0;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const resolved = await resolveAdminRole(profile.phone);
  if (!resolved) return null;

  return {
    userId: profile.id,
    phone: profile.phone,
    fullName: profile.fullName,
    role: resolved.role,
    bootstrapped: resolved.bootstrapped,
  };
});
