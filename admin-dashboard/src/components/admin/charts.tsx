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

export function EvolutionLines({
  points,
}: {
  points: {
    label: string;
    clients: number;
    collected: number;
  }[];
}) {
  if (points.length === 0) {
    return (
      <p className="ad-muted text-sm">
        The bot has nothing to plot yet. When clients sign up and Premium is
        paid, this graph fills in on its own.
      </p>
    );
  }

  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 52, bottom: 32, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxClients = Math.max(1, ...points.map((point) => point.clients));
  const maxMoney = Math.max(1, ...points.map((point) => point.collected));
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const xs = points.map((_, index) => pad.left + index * step);
  const clientYs = points.map(
    (point) => pad.top + innerH - (point.clients / maxClients) * innerH,
  );
  const moneyYs = points.map(
    (point) => pad.top + innerH - (point.collected / maxMoney) * innerH,
  );
  const line = (ys: number[]) =>
    xs
      .map((x, index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${ys[index].toFixed(1)}`)
      .join(" ");
  const area = `${line(moneyYs)} L${xs[xs.length - 1].toFixed(1)},${(pad.top + innerH).toFixed(1)} L${xs[0].toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="evo-chart h-56 w-full"
      role="img"
      aria-label="Business evolution over the last 12 months"
    >
      {[0.25, 0.5, 0.75, 1].map((frac) => {
        const y = pad.top + innerH * (1 - frac);
        return (
          <line
            key={frac}
            x1={pad.left}
            x2={width - pad.right}
            y1={y}
            y2={y}
            stroke="var(--ad-border)"
            strokeDasharray="3 4"
          />
        );
      })}
      <path d={area} className="evo-area" fill="var(--ad-good)" opacity="0.16" />
      <path
        d={line(moneyYs)}
        className="evo-line evo-line-money"
        fill="none"
        stroke="var(--ad-good)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={line(clientYs)}
        className="evo-line evo-line-clients"
        fill="none"
        stroke="var(--ad-brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {xs.map((x, index) => (
        <g key={`${points[index].label}-${index}`}>
          <circle cx={x} cy={clientYs[index]} r="3.2" fill="var(--ad-brand)" />
          <circle cx={x} cy={moneyYs[index]} r="3.2" fill="var(--ad-good)" />
        </g>
      ))}
      {points.map((point, index) =>
        index === 0 || index === points.length - 1 || index % 2 === 0 ? (
          <text
            key={`${point.label}-tick`}
            x={xs[index]}
            y={height - 8}
            textAnchor="middle"
            fill="var(--ad-text-mute)"
            fontSize="10"
          >
            {point.label}
          </text>
        ) : null,
      )}
      <text
        x={pad.left}
        y={12}
        fill="var(--ad-text-mute)"
        fontSize="10"
      >
        {maxClients} clients
      </text>
      <text
        x={width - pad.right}
        y={12}
        textAnchor="end"
        fill="var(--ad-text-mute)"
        fontSize="10"
      >
        {formatMoney(maxMoney)}
      </text>
    </svg>
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
