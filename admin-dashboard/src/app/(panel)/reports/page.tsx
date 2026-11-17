import { notFound } from "next/navigation";
import { EvolutionBot } from "@/components/admin/evolution-bot";
import { MonthlyBars, ShareBars } from "@/components/admin/charts";
import { PeriodFilter } from "@/components/admin/period-filter";
import { ReportExport } from "@/components/admin/report-export";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import {
  buildEvolutionReport,
  expensesByCategory,
  foldTransactions,
  forecastNextMonth,
  inPeriod,
  monthlySeries,
  parseRange,
  previousPeriodRows,
} from "@/lib/admin/insights";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { formatMoney } from "@/lib/format";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "transactions.view")) notFound();

  const { range: raw } = await searchParams;
  const range = parseRange(raw);
  const snapshot = await loadAdminSnapshot();
  const periodRows = snapshot.transactions.filter((row) => inPeriod(row.date, range));
  const totals = foldTransactions(periodRows);
  const previous = foldTransactions(previousPeriodRows(snapshot.transactions, range));
  const series = monthlySeries(snapshot.transactions, range);
  const slices = expensesByCategory(periodRows);
  const forecast = forecastNextMonth(series);
  const evolution = buildEvolutionReport(snapshot);
  const mayExport = can(session.role, "transactions.export");

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title="Reports and analytics"
        description="Monthly totals, spending mix, a simple next-month forecast, and a file you can open in Excel or print to PDF."
        actions={
          <div className="flex flex-wrap gap-2 no-print">
            <PeriodFilter pathname="/reports" current={range} />
            {mayExport ? (
              <ReportExport
                range={range}
                totals={totals}
                previous={previous}
                series={series}
                slices={slices}
                forecast={forecast}
              />
            ) : null}
          </div>
        }
      />

      <EvolutionBot report={evolution} reportsHref="/" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={formatMoney(totals.income)} tone="good" />
        <StatCard label="Expenses" value={formatMoney(totals.expense)} tone="bad" />
        <StatCard
          label="Profit"
          value={formatMoney(totals.profit)}
          tone={totals.profit >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Next month (forecast)"
          value={formatMoney(forecast.nextProfit)}
          hint={`${formatMoney(forecast.nextIncome)} in · ${formatMoney(forecast.nextExpense)} out`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Monthly report</h3>
          <p className="ad-muted mt-1 text-sm">
            Average of the last three months is used for the forecast.
          </p>
          <div className="mt-4">
            <MonthlyBars points={series} />
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Expense report</h3>
          <div className="mt-4">
            <ShareBars rows={slices} />
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.month}>
                  <td>{point.label}</td>
                  <td className="tabular-nums">{formatMoney(point.income)}</td>
                  <td className="tabular-nums">{formatMoney(point.expense)}</td>
                  <td className="tabular-nums">{formatMoney(point.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
