"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { NightModeToggle } from "@/components/night-mode-toggle";
import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/types";

const NAV = [
  { href: "/app/account", label: "Account" },
  { href: "/app", label: "Dashboard" },
  { href: "/app/transactions", label: "Transactions" },
  { href: "/app/budget", label: "Budget" },
  { href: "/app/goals", label: "Goals" },
  { href: "/app/stats", label: "Statistics" },
  { href: "/app/appearance", label: "Appearance" },
  { href: "/app/categories", label: "Categories" },
  { href: "/app/support", label: "Support" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav({
  phone,
  plan,
  night = false,
  fullName,
}: {
  phone: string;
  plan: Plan;
  night?: boolean;
  fullName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar flex w-full flex-col border-b md:h-dvh md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <Logo tone="light" href="/app/account" />
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              plan === "premium"
                ? "bg-azure-strong text-white"
                : "border border-white/25 text-mute"
            }`}
          >
            {PLANS[plan].label}
          </span>
          <div className="md:hidden">
            <NightModeToggle initialNight={night} variant="icon" />
          </div>
          <form action={signOutAction} className="md:hidden">
            <button
              type="submit"
              className="rounded-md border border-white/25 px-2 py-1 text-xs text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <p className="truncate px-4 pb-3 text-sm font-medium md:hidden">{fullName}</p>
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
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-azure-strong font-medium text-white"
                  : "text-mute hover:bg-navy-soft hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden border-t border-white/10 px-4 py-4 md:block">
        <p className="truncate text-sm font-medium">{fullName}</p>
        <p className="mt-1 truncate text-xs text-mute">{phone}</p>
        <div className="mt-3">
          <NightModeToggle initialNight={night} variant="icon" />
        </div>
        <form action={signOutAction}>
          <button type="submit" className="btn-secondary mt-2 w-full text-sm">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
