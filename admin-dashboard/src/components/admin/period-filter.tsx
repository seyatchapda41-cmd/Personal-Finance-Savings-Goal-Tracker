import Link from "next/link";
import {
  RANGE_OPTIONS,
  type RangeKey,
} from "@/lib/admin/insights";

export function PeriodFilter({
  pathname,
  current,
}: {
  pathname: string;
  current: RangeKey;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {RANGE_OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={`${pathname}?range=${option.value}`}
          className="ad-btn"
          style={
            current === option.value
              ? {
                  borderColor: "var(--ad-brand)",
                  background: "var(--ad-brand-soft)",
                  color: "var(--ad-brand-text)",
                }
              : undefined
          }
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
