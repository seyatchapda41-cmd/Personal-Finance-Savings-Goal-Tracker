import Link from "next/link";
import { APP_NAME, APP_VERSION } from "@/lib/config";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-mute">
            {APP_NAME} helps individuals record income and expenses, watch cash
            flow, and track savings goals without spreadsheets.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mute">
            <Link href="/#features">Features</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/security">Security</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-mute">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-mute">
        © {new Date().getFullYear()} {APP_NAME} · v{APP_VERSION} · Personal
        finance tracker
      </div>
    </footer>
  );
}
