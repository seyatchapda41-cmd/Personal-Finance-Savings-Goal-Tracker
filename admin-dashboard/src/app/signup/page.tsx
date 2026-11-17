import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSignupForm } from "@/components/admin/signup-form";
import { getAdminSession } from "@/lib/admin/session";
import { nightFromCookieStore } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSignupPage() {
  const session = await getAdminSession();
  if (!session || session.role !== "founder") redirect("/login");

  const store = await cookies();
  const night = nightFromCookieStore(store);
  return <AdminSignupForm night={night} />;
}
