import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SessionGuard } from "@/components/auth/session-guard";
import { AppShell } from "@/components/app-shell";
import { PlatformGate } from "@/components/platform-gate";
import { getCurrentProfile, readResetBooksFlag } from "@/lib/auth/profile";
import { nightFromCookieStore } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?reason=expired");
  const [resetBooks, store] = await Promise.all([
    readResetBooksFlag(),
    cookies(),
  ]);
  const night = nightFromCookieStore(store);

  return (
    <PlatformGate>
      <SessionGuard>
        <AppShell
          profile={profile}
          resetBooks={resetBooks}
          night={night}
        >
          {children}
        </AppShell>
      </SessionGuard>
    </PlatformGate>
  );
}
