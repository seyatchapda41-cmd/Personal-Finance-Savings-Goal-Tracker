"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function BrandMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/mark.png"
      alt=""
      width={size}
      height={size}
      className={`rounded-[22%] ${className}`}
      priority
    />
  );
}

export function Logo({
  compact = false,
  href = "/",
  tone = "dark",
}: {
  compact?: boolean;
  href?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 ${
        tone === "light" ? "text-white" : "text-ink"
      }`}
    >
      <BrandMark size={32} />
      {compact ? (
        <span className="sr-only">{APP_NAME}</span>
      ) : (
        <span className="font-semibold tracking-tight">{APP_NAME}</span>
      )}
    </Link>
  );
}
