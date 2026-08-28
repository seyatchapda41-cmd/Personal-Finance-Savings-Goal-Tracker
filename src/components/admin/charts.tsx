import { formatMoney } from "@/lib/format";

export function MonthlyBars({
  points,
}: {
  points: { label: string; income: number; expense: number }[];
}) {
  const max = Math.max(
    1,
    ...points.flatMap((point) => [point.income, point.expense]),
  );
  if (points.length === 0) {
    return (
      <p className="ad-muted text-sm">No records in this period yet.</p>
    );
  }

  return (
    <div className="flex h-48 items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div className="flex h-40 w-full items-end justify-center gap-0.5">
            <div
              className="w-[45%] rounded-t"
              title={`Income ${formatMoney(point.income)}`}
              style={{
                height: `${(point.income / max) * 100}%`,
                minHeight: point.income > 0 ? 4 : 0,
                background: "var(--ad-good)",
              }}
            />
            <div
              className="w-[45%] rounded-t"
              title={`Expenses ${formatMoney(point.expense)}`}
              style={{
                height: `${(point.expense / max) * 100}%`,
                minHeight: point.expense > 0 ? 4 : 0,
                background: "var(--ad-bad)",
              }}
            />
          </div>
          <span className="ad-muted w-full truncate text-center text-[10px]">
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ShareBars({
  rows,
}: {
  rows: { name: string; amount: number; share: number }[];
}) {
  if (rows.length === 0) {
    return <p className="ad-muted text-sm">No expenses in this period.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.slice(0, 8).map((row) => (
        <li key={row.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{row.name}</span>
            <span className="ad-muted shrink-0 tabular-nums">
              {formatMoney(row.amount)} · {Math.round(row.share)}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "var(--ad-surface-2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, row.share)}%`,
                background: "var(--ad-brand)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SplitMeter({
  fixed,
  variable,
}: {
  fixed: number;
  variable: number;
}) {
  const total = fixed + variable;
  if (total <= 0) {
    return <p className="ad-muted text-sm">No expenses to split yet.</p>;
  }
  const fixedShare = (fixed / total) * 100;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        <div style={{ width: `${fixedShare}%`, background: "var(--ad-brand)" }} />
        <div style={{ width: `${100 - fixedShare}%`, background: "var(--ad-warn)" }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <p>
          <span className="ad-muted block text-xs">Fixed</span>
          {formatMoney(fixed)} · {Math.round(fixedShare)}%
        </p>
        <p>
          <span className="ad-muted block text-xs">Variable</span>
          {formatMoney(variable)} · {Math.round(100 - fixedShare)}%
        </p>
      </div>
    </div>
  );
}
