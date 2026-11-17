import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

/**
 * Server-side gate for authenticated app routes. Middleware already blocks
 * anonymous visitors; this re-checks the session before rendering books.
 */
export async function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?reason=expired");
  return children;
}
