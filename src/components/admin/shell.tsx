"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { adminSignOutAction } from "@/app/actions/admin-auth";
import { Icons } from "@/components/admin/icons";
import { ROLE_LABEL, type AdminRole, type Permission } from "@/lib/admin/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof Icons;
  permission: Permission;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "overview", permission: "clients.view" },
  {
    href: "/admin/books",
    label: "Finance",
    icon: "revenue",
    permission: "transactions.view",
  },
  { href: "/admin/goals", label: "Goals", icon: "goals", permission: "transactions.view" },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: "reports",
    permission: "transactions.view",
  },
  { href: "/admin/alerts", label: "Alerts", icon: "alert", permission: "transactions.view" },
  { href: "/admin/clients", label: "Clients", icon: "clients", permission: "clients.view" },
  {
    href: "/admin/transactions",
    label: "Transactions",
    icon: "transactions",
    permission: "transactions.view",
  },
  { href: "/admin/payments", label: "Payments", icon: "payments", permission: "payments.view" },
  { href: "/admin/support", label: "Conversations", icon: "support", permission: "support.view" },
  { href: "/admin/audit", label: "Audit trail", icon: "audit", permission: "audit.view" },
  { href: "/admin/team", label: "Team", icon: "team", permission: "team.manage" },
  { href: "/admin/settings", label: "Platform", icon: "settings", permission: "settings.manage" },
];

const THEME_COOKIE = "tempora_admin_theme";

export function AdminShell({
  role,
  name,
  phone,
  permissions,
  initialTheme,
  maintenanceMode,
  children,
}: {
  role: AdminRole;
  name: string;
  phone: string;
  permissions: readonly Permission[];
  initialTheme: "light" | "dark";
  maintenanceMode: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState(initialTheme);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigating on a phone should not leave the drawer covering the page.
  useEffect(() => setMenuOpen(false), [pathname]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  const visible = NAV.filter((item) => permissions.includes(item.permission));
  const current = visible.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  );

  return (
    <div className={`admin ${theme === "dark" ? "dark" : ""} min-h-dvh`}>
      <div className="ad-shell flex min-h-dvh">
        {menuOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <aside
          className={`ad-sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform md:static md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-sm font-bold text-white"
                style={{ background: "var(--ad-brand)" }}
              >
                T
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">Tempora</span>
                <span className="ad-muted block text-xs">Control panel</span>
              </span>
            </Link>
            <button
              type="button"
              className="ad-muted md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <Icons.close />
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
            {visible.map((item) => {
              const Icon = Icons[item.icon];
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ad-nav-link"
                  data-active={active}
                >
                  <Icon />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t px-3 py-3 ad-divide" style={{ borderColor: "var(--ad-border)" }}>
            <div className="flex items-center gap-2.5 px-1 pb-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold"
                style={{
                  background: "var(--ad-brand-soft)",
                  color: "var(--ad-brand-text)",
                }}
              >
                {name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-sm font-medium">{name}</span>
                <span className="ad-muted block truncate text-xs">{phone}</span>
              </span>
            </div>
            <span className="ad-badge ad-badge-brand mx-1">{ROLE_LABEL[role]}</span>
            <form action={adminSignOutAction} className="mt-3">
              <button type="submit" className="ad-btn w-full">
                <Icons.logout />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="ad-topbar sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3">
            <button
              type="button"
              className="ad-btn px-2 md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icons.menu />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-semibold">
                {current?.label ?? "Control panel"}
              </h1>
              <p className="ad-muted truncate text-xs">
                Signed in as {ROLE_LABEL[role]}
              </p>
            </div>
            {maintenanceMode ? (
              <span className="ad-badge ad-badge-warn">
                <Icons.alert className="h-3 w-3" />
                Maintenance on
              </span>
            ) : null}
            <Link href="/app/account" className="ad-btn hidden sm:inline-flex">
              Client view
            </Link>
            <button
              type="button"
              className="ad-btn px-2"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Icons.sun /> : <Icons.moon />}
            </button>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
