import { SUPPORT_MAX_STARS } from "@/lib/plans";

export function Stars({
  value,
  max = SUPPORT_MAX_STARS,
}: {
  value: number;
  max?: number;
}) {
  return (
    <span
      className="tracking-widest"
      role="img"
      aria-label={`${value} out of ${max} stars`}
    >
      {"★".repeat(value)}
      <span className="opacity-40">{"★".repeat(Math.max(0, max - value))}</span>
    </span>
  );
}
