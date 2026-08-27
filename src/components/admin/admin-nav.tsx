"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/transactions", label: "Transactions" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/support", label: "Support queue" },
];

export function AdminNav({ founderName }: { founderName: string }) {
  const pathname = usePathname();

  return (
    <aside className="on-blue flex w-full flex-col border-b border-line bg-panel md:h-dvh md:w-60 md:border-b-0 md:border-r">
      <div className="px-4 py-4">
        <Logo />
        <p className="mt-2 text-xs text-mute">Founder panel</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
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
        <p className="truncate text-xs text-mute">{founderName}</p>
        <Link href="/app/account" className="btn-secondary mt-2 w-full text-sm">
          Client view
        </Link>
      </div>
    </aside>
  );
}
