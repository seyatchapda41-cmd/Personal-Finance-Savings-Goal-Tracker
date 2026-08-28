import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthlyBars, ShareBars, SplitMeter } from "@/components/admin/charts";
import { PeriodFilter } from "@/components/admin/period-filter";
import { signedFlow } from "@/components/admin/transactions-table";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import {
  costSplit,
  expensesByCategory,
  foldTransactions,
  inPeriod,
  monthlySeries,
  parseRange,
  previousPeriodRows,
} from "@/lib/admin/insights";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { currentMonthKey, formatDate, formatMoney } from "@/lib/format";

export default async function AdminBooksPage({
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
  const split = costSplit(slices);
  const month = currentMonthKey();
  const plannedFromBudgets = snapshot.budgets
    .filter((row) => row.month === month)
    .reduce((sum, row) => sum + row.expenseLimit, 0);
  const plannedExpense =
    plannedFromBudgets > 0 ? plannedFromBudgets : previous.expense;
  const plannedLabel =
    plannedFromBudgets > 0 ? "Client budgets this month" : "Previous period";
  const recent = [...periodRows]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial overview"
        description="Income by month, spending by category, recent records, and planned versus actual expenses."
        actions={<PeriodFilter pathname="/admin/books" current={range} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={formatMoney(totals.income)} tone="good" />
        <StatCard label="Expenses" value={formatMoney(totals.expense)} tone="bad" />
        <StatCard
          label="Planned spend"
          value={formatMoney(plannedExpense)}
          hint={plannedLabel}
        />
        <StatCard
          label="Vs plan"
          value={
            plannedExpense > 0
              ? `${Math.round((totals.expense / plannedExpense) * 100)}%`
              : "—"
          }
          hint={
            plannedExpense > 0 && totals.expense > plannedExpense
              ? "Over budget"
              : "Within budget"
          }
          tone={
            plannedExpense > 0 && totals.expense > plannedExpense ? "bad" : "good"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Income and expenses by month</h3>
          <div className="mt-4">
            <MonthlyBars points={series} />
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Expenses by category</h3>
          <div className="mt-4">
            <ShareBars rows={slices} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Fixed and variable costs</h3>
          <p className="ad-muted mt-1 text-sm">
            Housing, utilities, insurance and similar names count as fixed.
            Everything else is treated as variable.
          </p>
          <div className="mt-4">
            <SplitMeter fixed={split.fixed} variable={split.variable} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Recent transactions</h3>
            <Link href="/admin/transactions" className="ad-btn">
              All records
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No records in this period"
              description="When clients add income or expenses, they appear here."
            />
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {recent.map((row) => {
                const signed = signedFlow(row);
                return (
                  <li key={row.id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {row.fullName} · {row.categoryName}
                      </span>
                      <span className="ad-muted block truncate text-xs">
                        {formatDate(row.date)}
                        {row.createdBy ? ` · ${row.createdBy}` : ""}
                        {row.origin !== "client" ? ` · ${row.origin}` : ""}
                      </span>
                    </span>
                    <span
                      className="shrink-0 tabular-nums"
                      style={{
                        color: signed < 0 ? "var(--ad-bad)" : "var(--ad-good)",
                      }}
                    >
                      {signed < 0 ? "-" : "+"}
                      {formatMoney(Math.abs(signed))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {slices.length > 0 ? (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Kind</th>
                  <th>Amount</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {slices.map((slice) => (
                  <tr key={slice.name}>
                    <td>{slice.name}</td>
                    <td>
                      <Badge tone={slice.fixed ? "brand" : "neutral"}>
                        {slice.fixed ? "Fixed" : "Variable"}
                      </Badge>
                    </td>
                    <td className="tabular-nums">{formatMoney(slice.amount)}</td>
                    <td className="tabular-nums">{Math.round(slice.share)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
