import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { founderSeatOpen, getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

// Deliberately outside the /admin layout: that layout guards the panel and
// would bounce this page back to itself.
export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const store = await cookies();
  const theme =
    store.get("tempora_admin_theme")?.value === "dark" ? "dark" : "light";

  return (
    <AdminLoginForm theme={theme} needsFounder={await founderSeatOpen()} />
  );
}
