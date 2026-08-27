import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getCurrentProfile, readResetBooksFlag } from "@/lib/auth/profile";
import { FinanceProvider } from "@/lib/finance-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const resetBooks = await readResetBooksFlag();

  return (
    <FinanceProvider profile={profile} resetBooks={resetBooks}>
      <div className="flex min-h-dvh flex-col bg-page md:flex-row">
        <AppNav phone={profile.phone} plan={profile.plan} />
        <div className="flex-1 overflow-auto p-4 sm:p-8">{children}</div>
      </div>
    </FinanceProvider>
  );
}
