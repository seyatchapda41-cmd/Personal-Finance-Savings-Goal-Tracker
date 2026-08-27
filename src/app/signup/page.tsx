import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountChooser } from "@/components/account-chooser";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";
import { PlanChoice } from "@/components/plan-choice";
import { readPremiumReceipt } from "@/lib/billing-server";
import { readKnownAccounts } from "@/lib/known-accounts-server";
import { normalizePlan } from "@/lib/plans";
import { signUpAction } from "@/app/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan = normalizePlan(plan);
  const [receipt, knownAccounts] = await Promise.all([
    readPremiumReceipt(),
    readKnownAccounts(),
  ]);

  // Premium is only offered here once it has been paid for.
  if (initialPlan === "premium" && !receipt) redirect("/checkout");

  // Someone who just paid came here to create a new account, so don't ask them
  // to pick an old one.
  const chooserAccounts = receipt ? [] : knownAccounts;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">
        {chooserAccounts.length > 0 ? "Choose an account" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-mute">
        {chooserAccounts.length > 0
          ? "Continue with an account you already have, or create a new one."
          : "Pick an account type. Your phone number is the credential you will log in with; email is kept for receipts and recovery."}
      </p>
      <div className="mt-8">
        <AccountChooser accounts={chooserAccounts}>
          <AuthForm
            action={signUpAction}
            submitLabel="Sign up"
            newPassword
            extraFields={
              <>
                <PlanChoice initialPlan={initialPlan} paidReceipt={receipt} />
                <label className="block text-sm">
                  Full name
                  <input
                    className="input mt-1"
                    name="fullName"
                    required
                    autoComplete="name"
                  />
                </label>
                <label className="block text-sm">
                  Email
                  <input
                    className="input mt-1"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                  />
                </label>
              </>
            }
            footer={
              <p className="text-center text-sm text-mute">
                Already have an account?{" "}
                <Link href="/login" className="text-azure">
                  Log in
                </Link>
              </p>
            }
          />
        </AccountChooser>
      </div>
    </div>
  );
}
