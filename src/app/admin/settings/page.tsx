import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, PageHeader } from "@/components/admin/ui";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { readPlatformSettings } from "@/lib/admin/settings";
import { isSupabaseConfigured } from "@/lib/config";

// Only whether a value is set is ever shown. The values themselves stay on the
// server, so the panel cannot become a way to read secrets out of the host.
function configRows() {
  return [
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      note: "Database endpoint used by the browser and server.",
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      note: "Public key. Safe in the browser; limited by row level security.",
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      note: "Full access key. Server only, and never sent to the browser.",
    },
    {
      key: "ADMIN_PHONES",
      set: Boolean(process.env.ADMIN_PHONES),
      note: "If set, only these founder phones can open /admin. Leave empty to use the founder created on the staff door.",
    },
    {
      key: "NEXT_PUBLIC_SITE_URL",
      set: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      note: "Used to build links in emails and redirects.",
    },
  ];
}

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "settings.manage")) notFound();

  const settings = await readPlatformSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform"
        description="Founder-only switches that affect the whole site, and a read-only view of how this deployment is configured."
      />

      <SettingsForm
        settings={settings}
        disabled={!isSupabaseConfigured()}
        updatedBy={settings.updatedBy}
        updatedAt={settings.updatedAt}
      />

      <Card padded={false}>
        <div className="px-5 pt-5">
          <h3 className="font-semibold">Environment</h3>
          <p className="ad-muted mt-1 text-sm">
            Whether each value is present, never the value itself.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Variable</th>
                <th>State</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {configRows().map((row) => (
                <tr key={row.key}>
                  <td>
                    <span className="ad-kbd">{row.key}</span>
                  </td>
                  <td>
                    <span
                      className={`ad-badge ${row.set ? "ad-badge-good" : "ad-badge-bad"}`}
                    >
                      {row.set ? "set" : "missing"}
                    </span>
                  </td>
                  <td className="ad-soft">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
