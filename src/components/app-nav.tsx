"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/types";

const NAV = [
  { href: "/app/account", label: "Account" },
  { href: "/app", label: "Dashboard" },
  { href: "/app/transactions", label: "Transactions" },
  { href: "/app/budget", label: "Budget" },
  { href: "/app/goals", label: "Goals" },
  { href: "/app/stats", label: "Statistics" },
  { href: "/app/categories", label: "Categories" },
  { href: "/app/support", label: "Support" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({ phone, plan }: { phone: string; plan: Plan }) {
  const pathname = usePathname();

  return (
    <aside className="on-blue flex w-full flex-col border-b border-line bg-panel md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Logo />
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              plan === "premium"
                ? "bg-white text-azure-strong"
                : "border border-white/40 text-mute"
            }`}
          >
            {PLANS[plan].label}
          </span>
          {/* Desktop keeps sign out in the sidebar footer. */}
          <form action={signOutAction} className="md:hidden">
            <button
              type="submit"
              className="rounded-md border border-white/60 px-2 py-1 text-xs"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-white font-medium text-azure-strong"
                  : "text-mute hover:bg-sand hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-line px-4 py-4 md:block">
        <p className="truncate text-xs text-mute">{phone}</p>
        <form action={signOutAction}>
          <button type="submit" className="btn-secondary mt-2 w-full text-sm">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
