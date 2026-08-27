import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { isSupabaseConfigured } from "@/lib/config";
import { readKnownAccounts } from "@/lib/known-accounts-server";
import { normalizePhone } from "@/lib/phone";
import { normalizePlan, PLANS } from "@/lib/plans";
import { signInAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; phone?: string }>;
}) {
  const { next, phone } = await searchParams;
  const chosenPhone = phone ? normalizePhone(phone) : "";
  const knownAccounts = await readKnownAccounts();
  const chosen = knownAccounts.find((a) => a.phone === chosenPhone);
  const others = knownAccounts.filter((a) => a.phone !== chosenPhone);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">
        {chosen ? `Welcome back, ${chosen.fullName}` : "Log in"}
      </h1>
      <p className="mt-2 text-sm text-mute">
        {chosen
          ? `Enter the password for ${chosen.phone} (${PLANS[normalizePlan(chosen.plan)].label} account).`
          : "Standard and Premium accounts both sign in with the phone number used at signup."}
        {isSupabaseConfigured()
          ? ""
          : " Demo mode: the account must exist on this browser first."}
      </p>
      <div className="mt-8">
        <AuthForm
          action={signInAction}
          submitLabel="Log in"
          nextPath={next || "/app/account"}
          defaultPhone={chosenPhone || undefined}
          footer={
            <p className="text-center text-sm text-mute">
              <Link href="/forgot-password" className="text-azure">
                Forgot password
              </Link>
              {" · "}
              <Link href="/signup" className="text-azure">
                Create account
              </Link>
            </p>
          }
        />
      </div>

      {others.length > 0 ? (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-mute">
            Other accounts on this device
          </p>
          <ul className="mt-3 space-y-2">
            {others.map((account) => (
              <li key={account.phone}>
                <Link
                  href={`/login?phone=${encodeURIComponent(account.phone)}`}
                  className="block rounded-lg border border-line bg-white p-3"
                >
                  <span className="block text-sm font-medium">
                    {account.fullName}
                  </span>
                  <span className="block text-xs text-mute">
                    {account.phone} ·{" "}
                    {PLANS[normalizePlan(account.plan)].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
