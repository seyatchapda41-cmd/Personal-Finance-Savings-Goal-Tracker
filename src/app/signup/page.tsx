import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/auth-shell";
import { PlanChoice } from "@/components/plan-choice";
import { readPremiumReceipt } from "@/lib/billing-server";
import { normalizePlan } from "@/lib/plans";
import { signUpAction } from "@/app/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const initialPlan = normalizePlan(plan);
  const receipt = await readPremiumReceipt();

  if (initialPlan === "premium" && !receipt) redirect("/checkout");

  return (
    <AuthShell
      title="Create your account"
      description="Watch your name, phone, and email appear as you type. After you register, the same phone and password will open this account on any device."
    >
      <RegisterForm
        action={signUpAction}
        extraFields={<PlanChoice initialPlan={initialPlan} paidReceipt={receipt} />}
        footer={
          <p className="text-center text-sm text-mute">
            Already have an account?{" "}
            <Link href="/login" className="text-azure">
              Log in
            </Link>
          </p>
        }
      />
    </AuthShell>
  );
}
