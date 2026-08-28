import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSignOutAction } from "@/app/actions/admin-auth";
import { AdminShell } from "@/components/admin/shell";
import { permissionsFor } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { readPlatformSettings } from "@/lib/admin/settings";
import { getCurrentProfile } from "@/lib/auth/profile";

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
  if (!profile) redirect("/admin/login");

  // Anyone without a role must not see the panel. Tell them plainly — a 404
  // looks like the feature is missing.
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-semibold">This account is not staff</h1>
        <p className="mt-3 text-sm text-mute">
          You are signed in, but this phone number is not on the staff list.
          Sign out, then use Staff sign in with the founder account.
        </p>
        <form action={adminSignOutAction} className="mt-6">
          <button type="submit" className="btn-primary">
            Sign out and use staff door
          </button>
        </form>
      </div>
    );
  }

  const [settings, store] = await Promise.all([
    readPlatformSettings(),
    cookies(),
  ]);
  const theme =
    store.get("tempora_admin_theme")?.value === "dark" ? "dark" : "light";

  return (
    <AdminShell
      role={session.role}
      name={session.fullName}
      phone={session.phone}
      permissions={permissionsFor(session.role)}
      initialTheme={theme}
      maintenanceMode={settings.maintenanceMode}
    >
      {children}
    </AdminShell>
  );
}
