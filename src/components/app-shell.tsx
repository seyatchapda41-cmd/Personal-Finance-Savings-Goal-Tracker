"use client";

import { AppNav } from "@/components/app-nav";
import { FinanceProvider } from "@/lib/finance-context";
import type { Profile } from "@/lib/types";

export function AppShell({
  profile,
  resetBooks,
  night = false,
  children,
}: {
  profile: Profile;
  resetBooks: boolean;
  night?: boolean;
  children: React.ReactNode;
}) {
  return (
    <FinanceProvider profile={profile} resetBooks={resetBooks}>
      <div className="flex min-h-dvh flex-col bg-page md:flex-row">
        <AppNav
          phone={profile.phone}
          plan={profile.plan}
          night={night}
          fullName={profile.fullName}
        />
        <div className="flex-1 overflow-auto p-4 sm:p-8">{children}</div>
      </div>
    </FinanceProvider>
  );
}
