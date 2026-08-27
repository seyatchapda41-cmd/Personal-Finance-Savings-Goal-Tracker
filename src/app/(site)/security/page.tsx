import type { Metadata } from "next";

export const metadata: Metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Security</h1>
      <div className="mt-8 space-y-6 text-mute">
        <p>
          Financial records are personal. Tempora is designed so each signed-in
          user only reads and writes their own data.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Passwords are hashed by the identity provider (Supabase Auth in production).</li>
          <li>All production traffic is served over HTTPS.</li>
          <li>PostgreSQL row-level security blocks cross-account queries.</li>
          <li>Daily database backups are available through the hosted database.</li>
        </ul>
        <p>
          Bank connections, joint accounts, and third-party aggregators are out
          of scope for version one.
        </p>
      </div>
    </div>
  );
}
