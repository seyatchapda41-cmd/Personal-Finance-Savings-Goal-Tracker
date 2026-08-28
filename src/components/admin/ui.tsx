import Link from "next/link";
import { Icons } from "@/components/admin/icons";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        {description ? (
          <p className="ad-soft mt-1 max-w-2xl text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`ad-card ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
  active = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: keyof typeof Icons;
  tone?: "neutral" | "good" | "warn" | "bad";
  href?: string;
  active?: boolean;
}) {
  const Icon = icon ? Icons[icon] : null;
  const toneColor =
    tone === "good"
      ? "var(--ad-good)"
      : tone === "warn"
        ? "var(--ad-warn)"
        : tone === "bad"
          ? "var(--ad-bad)"
          : "var(--ad-brand-text)";
  const toneBg =
    tone === "good"
      ? "var(--ad-good-soft)"
      : tone === "warn"
        ? "var(--ad-warn-soft)"
        : tone === "bad"
          ? "var(--ad-bad-soft)"
          : "var(--ad-brand-soft)";

  const card = (
    <div
      className="ad-card p-5 h-full"
      style={
        active
          ? { borderColor: "var(--ad-brand)", background: "var(--ad-brand-soft)" }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="ad-muted text-xs font-medium uppercase tracking-wide">
          {label}
        </p>
        {Icon ? (
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: toneBg, color: toneColor }}
          >
            <Icon />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums sm:text-3xl">
        {value}
      </p>
      {hint ? <p className="ad-muted mt-1 text-xs">{hint}</p> : null}
      {href ? (
        <p className="mt-3 text-xs font-medium" style={{ color: "var(--ad-brand-text)" }}>
          {active ? "Showing details" : "Click for details"}
        </p>
      ) : null}
    </div>
  );

  if (!href) return card;
  return (
    <Link
      href={href}
      className="block h-full cursor-pointer no-underline transition hover:brightness-110"
    >
      {card}
    </Link>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "good" | "warn" | "bad";
}) {
  return <span className={`ad-badge ad-badge-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="ad-card px-6 py-14 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="ad-muted mx-auto mt-2 max-w-md text-sm">{description}</p>
      ) : null}
    </div>
  );
}

export function Notice({
  children,
  tone = "warn",
}: {
  children: React.ReactNode;
  tone?: "warn" | "bad" | "brand";
}) {
  const color =
    tone === "bad"
      ? "var(--ad-bad)"
      : tone === "brand"
        ? "var(--ad-brand-text)"
        : "var(--ad-warn)";
  const background =
    tone === "bad"
      ? "var(--ad-bad-soft)"
      : tone === "brand"
        ? "var(--ad-brand-soft)"
        : "var(--ad-warn-soft)";

  return (
    <div
      className="flex gap-3 rounded-xl border p-4 text-sm"
      style={{ background, borderColor: color, color }}
    >
      <Icons.alert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}
