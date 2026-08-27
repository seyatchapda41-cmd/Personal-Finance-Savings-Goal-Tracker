"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-mute md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-mute hover:text-ink">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Start tracking
          </Link>
        </div>
        <button
          type="button"
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors duration-150 hover:border-azure hover:bg-azure-soft hover:text-azure focus-visible:border-azure focus-visible:bg-azure-soft focus-visible:text-azure focus-visible:outline-none active:border-azure active:bg-azure-soft active:text-azure md:hidden ${
            open
              ? "border-azure bg-azure-soft text-azure"
              : "border-line text-ink"
          }`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          Menu
        </button>
      </div>
      {open ? (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-center" onClick={() => setOpen(false)}>
              Start tracking
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
