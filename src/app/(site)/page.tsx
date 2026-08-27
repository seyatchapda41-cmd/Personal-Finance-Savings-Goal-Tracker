import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-azure">
            Personal finance, made calm
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Track spending. Hit savings goals. Stop guessing.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-mute">
            {APP_NAME} replaces paper notes and fragile spreadsheets with a
            secure web app for income, expenses, categories, and savings
            milestones.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Create a free account
            </Link>
            <Link href="/features" className="btn-secondary">
              See features
            </Link>
          </div>
        </div>
        <div className="card space-y-4">
          <p className="text-sm text-mute">This month</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-sand p-4">
              <p className="text-xs text-mute">Income</p>
              <p className="mt-1 text-2xl font-semibold">$0.00</p>
            </div>
            <div className="rounded-lg bg-sand p-4">
              <p className="text-xs text-mute">Expenses</p>
              <p className="mt-1 text-2xl font-semibold">$0.00</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Emergency fund</span>
              <span>0%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
              <div className="h-full w-0 bg-azure" />
            </div>
          </div>
        </div>
      </section>

      <section className="on-blue border-y border-line bg-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            {
              title: "Fast transaction logging",
              body: "Record type, amount, date, and category in seconds — then see totals update immediately.",
            },
            {
              title: "Savings you can see",
              body: "Set a target and date. Watch progress instead of recalculating a spreadsheet.",
            },
            {
              title: "Private by default",
              body: "Each account is isolated. Production uses hashed passwords, HTTPS, and Postgres row-level security.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-mute">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
