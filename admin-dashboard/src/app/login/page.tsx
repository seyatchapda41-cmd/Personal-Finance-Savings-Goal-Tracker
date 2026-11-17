import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { founderSeatOpen, getAdminSession } from "@/lib/admin/session";
import { getCurrentProfile } from "@/lib/auth/profile";
import { nightFromCookieStore } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Deliberately outside the (panel) layout: that layout guards the desk and
// would bounce this page back to itself.
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect("/");

  const [{ reason }, profile, store] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    cookies(),
  ]);
  const night = nightFromCookieStore(store);

  return (
    <AdminLoginForm
      night={night}
      needsFounder={await founderSeatOpen()}
      clientSignedIn={Boolean(profile)}
      blockedAsClient={reason === "not-staff"}
    />
  );
}
