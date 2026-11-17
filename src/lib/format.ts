export const CURRENCY_CODE = "XAF";
export const CURRENCY_LABEL = "FCFA";

export function formatMoney(amount: number) {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  const n = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(value));
  return `${value < 0 ? "-" : ""}${n} ${CURRENCY_LABEL}`;
}

export function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function currentMonthKey() {
  return monthKey(todayIso());
}
