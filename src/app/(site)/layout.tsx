import { cookies } from "next/headers";
import { PlatformGate } from "@/components/platform-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { nightFromCookieStore } from "@/lib/themes";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const night = nightFromCookieStore(store);

  return (
    <PlatformGate>
      <SiteHeader night={night} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </PlatformGate>
  );
}
