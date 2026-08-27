import Link from "next/link";
import { loadAdminSnapshot, summarise } from "@/lib/admin/data";
import { formatMoney } from "@/lib/format";

export default async function AdminOverviewPage() {
  const snapshot = await loadAdminSnapshot();
  const totals = summarise(snapshot);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <p className="text-sm text-mute">Founder panel</p>
        <h1 className="mt-1 text-3xl font-semibold">Overview</h1>
        <p className="mt-2 text-sm text-mute">
          {snapshot.mode === "supabase"
            ? "Reading every client from the database."
            : "Running without a database, so this shows only what this browser holds."}
        </p>
      </header>

      {snapshot.notices.length > 0 ? (
        <section className="card space-y-2">
          <h2 className="font-semibold">Before you rely on this</h2>
          {snapshot.notices.map((notice) => (
            <p key={notice} className="text-sm text-mute">
              {notice}
            </p>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Clients</p>
          <p className="mt-2 text-3xl font-semibold">{totals.clients}</p>
          <p className="mt-1 text-xs text-mute">
            {totals.premium} Premium · {totals.standard} Standard
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Monthly recurring</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatMoney(totals.monthlyRecurring)}
          </p>
          <p className="mt-1 text-xs text-mute">
            From {totals.premium} Premium account
            {totals.premium === 1 ? "" : "s"}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Collected to date</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatMoney(totals.revenue)}
          </p>
          <p className="mt-1 text-xs text-mute">
            {snapshot.payments.length} payment
            {snapshot.payments.length === 1 ? "" : "s"} recorded
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs text-mute">Client transactions</p>
          <p className="mt-2 text-2xl font-semibold">{totals.transactions}</p>
          <p className="mt-1 text-xs text-mute">
            {formatMoney(totals.income)} in · {formatMoney(totals.expense)} out
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Open support</p>
          <p className="mt-2 text-2xl font-semibold">{totals.openSupport}</p>
          <p className="mt-1 text-xs text-mute">
            {totals.prioritySupport} waiting on priority service
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-mute">Where to act</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/admin/clients" className="text-azure">
                Clients and plans
              </Link>
            </li>
            <li>
              <Link href="/admin/transactions" className="text-azure">
                Cancel a transaction
              </Link>
            </li>
            <li>
              <Link href="/admin/support" className="text-azure">
                Answer support
              </Link>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
