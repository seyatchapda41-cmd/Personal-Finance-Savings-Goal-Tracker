import { notFound } from "next/navigation";
import { AlertsList } from "@/components/admin/alerts-list";
import { PeriodFilter } from "@/components/admin/period-filter";
import { Card, PageHeader } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { buildAlerts, parseRange } from "@/lib/admin/insights";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "transactions.view")) notFound();

  const { range: raw } = await searchParams;
  const range = parseRange(raw);
  const snapshot = await loadAdminSnapshot();
  const alerts = buildAlerts(snapshot, range);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications and alerts"
        description="Budget overruns, goals close to the line, unusual spending, low balances, and recent staff changes."
        actions={<PeriodFilter pathname="/admin/alerts" current={range} />}
      />
      <Card>
        <AlertsList alerts={alerts} />
      </Card>
    </div>
  );
}
