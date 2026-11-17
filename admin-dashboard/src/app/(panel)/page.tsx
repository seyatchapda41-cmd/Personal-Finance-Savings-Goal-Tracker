import Link from "next/link";
import {
  isOverviewBox,
  OverviewDetail,
  type OverviewBox,
} from "@/components/admin/overview-detail";
import { EvolutionBot } from "@/components/admin/evolution-bot";
import { AlertsList } from "@/components/admin/alerts-list";
import { MonthlyBars } from "@/components/admin/charts";
import { Card, Notice, PageHeader, StatCard } from "@/components/admin/ui";
import { loadAdminSnapshot, loadAuditTrail, summarise } from "@/lib/admin/data";
import {
  buildAlerts,
  buildEvolutionReport,
  foldTransactions,
  goalInsights,
  inPeriod,
  monthlySeries,
} from "@/lib/admin/insights";
import { readPlatformSettings } from "@/lib/admin/settings";
import { getAdminSession } from "@/lib/admin/session";
import { can, permissionsFor } from "@/lib/admin/rbac";
import { formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";

function boxHref(id: OverviewBox, current: OverviewBox | null) {
  return current === id ? "/" : `/?box=${id}#overview-details`;
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ box?: string }>;
}) {
  const { box: rawBox } = await searchParams;
  const box = isOverviewBox(rawBox) ? rawBox : null;
  const session = await getAdminSession();
  const [snapshot, settings, audit] = await Promise.all([
    loadAdminSnapshot(),
    readPlatformSettings(),
    session && can(session.role, "audit.view") ? loadAuditTrail(6) : [],
  ]);
  const totals = summarise(snapshot);
  const monthBooks = foldTransactions(
    snapshot.transactions.filter((row) => inPeriod(row.date, "this-month")),
  );
  const series = monthlySeries(snapshot.transactions, "12m");
  const evolution = buildEvolutionReport(snapshot);
  const alerts = buildAlerts(snapshot, "this-month");
  const goals = goalInsights(snapshot.goals, snapshot.clients);
  const goalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const goalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const goalPct = goalTarget > 0 ? Math.round((goalSaved / goalTarget) * 100) : 0;

  const health = [
    {
      label: "Database",
      value: snapshot.mode === "supabase" ? "Connected" : "Demo storage",
      ok: snapshot.mode === "supabase",
    },
    {
      label: "Public site",
      value: settings.maintenanceMode ? "In maintenance" : "Live",
      ok: !settings.maintenanceMode,
    },
    {
      label: "New signups",
      value: settings.signupsEnabled ? "Open" : "Closed",
      ok: settings.signupsEnabled,
    },
    {
      label: "Announcement",
      value: settings.announcementActive ? "Showing" : "Off",
      ok: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="ad-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="ad-muted text-xs font-medium uppercase tracking-[0.16em]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Welcome back{session?.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}
          </h2>
          <p className="ad-soft mt-1 text-sm">
            {snapshot.mode === "supabase"
              ? "Live company figures, client books, and alerts."
              : "Demo storage on this browser only — connect the database for the full picture."}
          </p>
        </div>
        <span
          className={`ad-badge ${
            snapshot.mode === "supabase" ? "ad-badge-good" : "ad-badge-warn"
          }`}
        >
          {snapshot.mode === "supabase" ? "Live database" : "Demo mode"}
        </span>
      </div>

      <PageHeader
        title="Overview"
        description={
          snapshot.mode === "supabase"
            ? "Company figures, client books this month, and alerts that need a look."
            : "No database is connected, so these figures cover this browser only."
        }
      />

      {snapshot.notices.length > 0 ? (
        <Notice>
          {snapshot.notices.map((notice) => (
            <p key={notice}>{notice}</p>
          ))}
        </Notice>
      ) : null}

      {session && can(session.role, "support.view") ? (
        <section className="ad-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Client support</h3>
              <p className="ad-muted mt-1 text-sm">
                Answer the messages clients send from their Support page.
              </p>
            </div>
            <Link href="/support" className="ad-btn ad-btn-primary">
              Answer clients
            </Link>
          </div>
          {snapshot.support.filter((item) => item.status === "open").length === 0 ? (
            <p className="ad-muted mt-4 text-sm">No client is waiting for an answer.</p>
          ) : (
            <ul className="mt-4 divide-y" style={{ borderColor: "var(--ad-border)" }}>
              {snapshot.support
                .filter((item) => item.status === "open")
                .slice(0, 5)
                .map((item) => (
                  <li key={item.ref} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.fullName || item.phone || "Client"}
                      </p>
                      <p className="ad-muted truncate text-sm">{item.subject}</p>
                    </div>
                    <Link
                      href={`/support?thread=${encodeURIComponent(item.ref)}`}
                      className="ad-btn shrink-0"
                    >
                      Reply
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href={boxHref("clients", box)}
          active={box === "clients"}
          label="Total clients"
          value={totals.clients}
          hint={`${totals.premium} Premium · ${totals.standard} Standard`}
          icon="clients"
        />
        <StatCard
          href={boxHref("recurring", box)}
          active={box === "recurring"}
          label="Monthly recurring"
          value={formatMoney(totals.monthlyRecurring)}
          hint={`${PLANS.premium.priceLabel} per Premium account`}
          icon="revenue"
          tone="good"
        />
        <StatCard
          href={boxHref("collected", box)}
          active={box === "collected"}
          label="Collected to date"
          value={formatMoney(totals.revenue)}
          hint={`${snapshot.payments.length} payments · ${totals.refunded} refunded`}
          icon="payments"
        />
        <StatCard
          href={boxHref("support", box)}
          active={box === "support"}
          label="Open support"
          value={totals.openSupport}
          hint={`${totals.prioritySupport} on priority service`}
          icon="support"
          tone={totals.prioritySupport > 0 ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href={boxHref("conversion", box)}
          active={box === "conversion"}
          label="Premium conversion"
          value={`${totals.conversion}%`}
          hint="Share of clients paying"
        />
        <StatCard
          href={boxHref("recent", box)}
          active={box === "recent"}
          label="New in 30 days"
          value={totals.newThisMonth}
          hint="Accounts created recently"
        />
        <StatCard
          href={boxHref("suspended", box)}
          active={box === "suspended"}
          label="Suspended"
          value={totals.suspended}
          hint="Accounts currently blocked"
          tone={totals.suspended > 0 ? "bad" : "neutral"}
        />
        <StatCard
          href={boxHref("records", box)}
          active={box === "records"}
          label="Client records"
          value={totals.transactions}
          hint={`${formatMoney(totals.income)} in · ${formatMoney(totals.expense)} out`}
        />
      </div>

      {box && session ? (
        <OverviewDetail
          box={box}
          snapshot={snapshot}
          permissions={permissionsFor(session.role)}
        />
      ) : null}

      <EvolutionBot report={evolution} />

      <div>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide ad-muted">
          Client books this month
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            href="/books"
            label="Total income"
            value={formatMoney(monthBooks.income)}
            icon="revenue"
            tone="good"
          />
          <StatCard
            href="/books"
            label="Total expenses"
            value={formatMoney(monthBooks.expense)}
            tone="bad"
          />
          <StatCard
            href="/books"
            label="Profit"
            value={formatMoney(monthBooks.profit)}
            tone={monthBooks.profit >= 0 ? "good" : "bad"}
          />
          <StatCard
            href="/goals"
            label="Goal progress"
            value={`${goalPct}%`}
            hint={`${formatMoney(goalSaved)} of ${formatMoney(goalTarget)}`}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Client books over 12 months</h3>
            <Link href="/reports" className="ad-btn">
              Reports
            </Link>
          </div>
          <MonthlyBars points={series} />
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Alerts</h3>
            <Link href="/alerts" className="ad-btn">
              All
            </Link>
          </div>
          <AlertsList alerts={alerts.slice(0, 5)} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold">System health</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {health.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="ad-soft">{item.label}</span>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: item.ok ? "var(--ad-good)" : "var(--ad-warn)",
                    }}
                  />
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Recent admin activity</h3>
            <Link href="/audit" className="ad-btn">
              Full trail
            </Link>
          </div>
          {audit.length === 0 ? (
            <p className="ad-muted mt-4 text-sm">
              Nothing recorded yet. Every action taken in this panel is logged
              here with who did it and when.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {audit.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {entry.action}
                      {entry.targetLabel ? ` · ${entry.targetLabel}` : ""}
                    </span>
                    <span className="ad-muted block truncate text-xs">
                      {entry.actorPhone} ({entry.actorRole})
                    </span>
                  </span>
                  <span className="ad-muted shrink-0 text-xs">
                    {timeAgo(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
