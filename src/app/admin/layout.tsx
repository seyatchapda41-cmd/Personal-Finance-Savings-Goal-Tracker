import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { adminConfigured, isAdminPhone } from "@/lib/admin/access";
import { getCurrentProfile } from "@/lib/auth/profile";

export const metadata: Metadata = { title: "Founder panel" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/admin");

  if (!adminConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Founder panel is not enabled</h1>
        <p className="mt-3 text-sm text-mute">
          Add your phone number to <code>ADMIN_PHONES</code> in{" "}
          <code>.env.local</code>, then restart the server. Use the same number
          you log in with, in full international form. Several numbers can be
          separated by commas.
        </p>
        <pre className="card mt-6 overflow-x-auto text-xs">
          ADMIN_PHONES={profile.phone || "+237650112233"}
        </pre>
        <p className="mt-6 text-sm">
          <Link href="/app/account" className="text-azure">
            Back to my account
          </Link>
        </p>
      </div>
    );
  }

  // Anyone else must not learn that this route exists.
  if (!isAdminPhone(profile.phone)) notFound();

  return (
    <div className="flex min-h-dvh flex-col bg-page md:flex-row">
      <AdminNav founderName={profile.fullName} />
      <div className="flex-1 overflow-auto p-4 sm:p-8">{children}</div>
    </div>
  );
}
