import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { permissionsFor } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { readPlatformSettings } from "@/lib/admin/settings";
import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { nightFromCookieStore } from "@/lib/themes";

async function countOpenSupport() {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createAdminSupabase();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("support_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  return count ?? 0;
}

export const metadata: Metadata = {
  title: "Control panel",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const session = await getAdminSession();
  if (!session) redirect("/login?reason=not-staff");

  const [settings, store, openSupport] = await Promise.all([
    readPlatformSettings(),
    cookies(),
    countOpenSupport(),
  ]);
  const night = nightFromCookieStore(store);

  return (
    <AdminShell
      role={session.role}
      name={session.fullName}
      phone={session.phone}
      permissions={permissionsFor(session.role)}
      initialNight={night}
      maintenanceMode={settings.maintenanceMode}
      openSupport={openSupport}
    >
      {children}
    </AdminShell>
  );
}
