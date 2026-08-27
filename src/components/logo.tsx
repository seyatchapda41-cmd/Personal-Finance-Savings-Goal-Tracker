import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-ink">
      <span className="logo-mark flex h-8 w-8 items-center justify-center rounded-md bg-azure-strong text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path
            fill="currentColor"
            d="M12 3.2 4.8 7v4.4c0 4.7 3.2 9.1 7.2 10.4 4-1.3 7.2-5.7 7.2-10.4V7L12 3.2Zm0 4.3c1.9 0 3.4 1.1 3.4 3 0 2.4-3.4 4.4-3.4 4.4S8.6 12.9 8.6 10.5c0-1.9 1.5-3 3.4-3Z"
          />
        </svg>
      </span>
      {compact ? (
        <span className="sr-only">{APP_NAME}</span>
      ) : (
        <span className="font-semibold tracking-tight">{APP_NAME}</span>
      )}
    </Link>
  );
}
