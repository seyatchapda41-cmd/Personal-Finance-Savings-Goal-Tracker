import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth-shell";
import { Notice } from "@/components/notice";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; phone?: string; reason?: string }>;
}) {
  const { next, phone, reason } = await searchParams;

  return (
    <AuthShell
      title="Log in to Tempora"
      description="Type the phone and password for your account. The same phone and password open it on a computer, a phone, or both at the same time. Signing out of one leaves the others signed in."
    >
      {reason === "expired" ? (
        <div className="mb-6">
          <Notice tone="bad">
            Your session ended. Sign in again with your phone and password.
          </Notice>
        </div>
      ) : null}
      <LoginForm
        action={signInAction}
        nextPath={next || "/app/account"}
        defaultPhone={phone}
        footer={
          <p className="text-center text-sm text-mute">
            <Link href="/forgot-password" className="text-azure">
              Forgot password
            </Link>
            <span className="mx-2 text-mute">·</span>
            <Link href="/signup" className="text-azure">
              Create new account
            </Link>
          </p>
        }
      />
      <p className="mt-10 text-center text-xs text-mute">
        <Link href="/">Back to the site</Link>
      </p>
    </AuthShell>
  );
}
