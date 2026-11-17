import Link from "next/link";
import { Badge } from "@/components/admin/ui";
import type { PlatformAlert } from "@/lib/admin/insights";

export function AlertsList({ alerts }: { alerts: PlatformAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="ad-muted text-sm">
        Nothing needs attention in this period.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <li key={alert.id}>
          <Link
            href={alert.href ?? "/alerts"}
            className="block rounded-xl border p-3 no-underline transition hover:brightness-110"
            style={{
              borderColor:
                alert.tone === "bad"
                  ? "var(--ad-bad)"
                  : alert.tone === "good"
                    ? "var(--ad-good)"
                    : alert.tone === "warn"
                      ? "var(--ad-warn)"
                      : "var(--ad-border)",
              background:
                alert.tone === "bad"
                  ? "var(--ad-bad-soft)"
                  : alert.tone === "good"
                    ? "var(--ad-good-soft)"
                    : alert.tone === "warn"
                      ? "var(--ad-warn-soft)"
                      : "var(--ad-surface-2)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{alert.title}</p>
              <Badge
                tone={
                  alert.tone === "neutral" ? "neutral" : alert.tone
                }
              >
                {alert.tone === "good"
                  ? "On track"
                  : alert.tone === "bad"
                    ? "Action"
                    : alert.tone === "warn"
                      ? "Watch"
                      : "Note"}
              </Badge>
            </div>
            <p className="ad-soft mt-1 text-sm">{alert.detail}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
