"use client";

import { formatMoney, todayIso } from "@/lib/format";
import type { CategorySlice, Forecast, MonthlyPoint, RangeKey } from "@/lib/admin/insights";

export function ReportExport({
  range,
  totals,
  previous,
  series,
  slices,
  forecast,
}: {
  range: RangeKey;
  totals: { income: number; expense: number; profit: number };
  previous: { income: number; expense: number; profit: number };
  series: MonthlyPoint[];
  slices: CategorySlice[];
  forecast: Forecast;
}) {
  function spreadsheet() {
    const lines = [
      "Tempora financial report",
      `Period,${range}`,
      `Generated,${todayIso()}`,
      "",
      "Summary,Income,Expenses,Profit",
      `This period,${totals.income},${totals.expense},${totals.profit}`,
      `Previous period,${previous.income},${previous.expense},${previous.profit}`,
      `Forecast next month,${forecast.nextIncome},${forecast.nextExpense},${forecast.nextProfit}`,
      "",
      "Month,Income,Expenses,Profit",
      ...series.map(
        (point) => `${point.month},${point.income},${point.expense},${point.profit}`,
      ),
      "",
      "Category,Amount,Share %,Kind",
      ...slices.map(
        (slice) =>
          `"${slice.name.replaceAll('"', '""')}",${slice.amount},${slice.share.toFixed(1)},${slice.fixed ? "fixed" : "variable"}`,
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tempora-report-${range}-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <span className="flex gap-1.5">
      <button type="button" className="ad-btn" onClick={spreadsheet}>
        Export Excel
      </button>
      <button type="button" className="ad-btn" onClick={() => window.print()}>
        Print / PDF
      </button>
      <span className="sr-only">
        {formatMoney(totals.profit)}
      </span>
    </span>
  );
}
