import Link from "next/link";
import { Logo } from "@/components/logo";
import { getAdminSession } from "@/lib/admin/session";
import { readPlatformSettings } from "@/lib/admin/settings";

// Applies the founder's platform switches to whatever it wraps: maintenance
// mode closes the page, and an active announcement rides above it. Admins pass
// through maintenance so the site can be checked while it is closed.
export async function PlatformGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await readPlatformSettings();

  if (settings.maintenanceMode) {
    const session = await getAdminSession();
    if (!session) {
      return (
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-semibold">Back shortly</h1>
          <p className="mt-3 text-sm text-mute">{settings.maintenanceMessage}</p>
          <p className="mt-8 text-sm">
            <Link href="/admin/login" className="text-azure">
              Staff sign in
            </Link>
          </p>
        </div>
      );
    }
  }

  return (
    <>
      {settings.announcementActive && settings.announcement ? (
        <div className="bg-azure-strong px-4 py-2 text-center text-sm text-white">
          {settings.announcement}
        </div>
      ) : null}
      {settings.maintenanceMode ? (
        <div className="bg-amber-500 px-4 py-2 text-center text-xs font-medium text-white">
          Maintenance mode is on. Clients cannot reach the site; you can because
          you are an admin.
        </div>
      ) : null}
      {children}
    </>
  );
}
