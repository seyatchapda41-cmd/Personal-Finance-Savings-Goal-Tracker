export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
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
