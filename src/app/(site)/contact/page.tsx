import Link from "next/link";
import { Stars } from "@/components/stars";
import { PLANS } from "@/lib/plans";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-3 leading-7 text-mute">
        Questions about the product or a private deployment go through Support
        inside the app, so your request arrives with your service level.
      </p>

      <div className="card mt-8 space-y-3 text-sm">
        <p className="font-semibold">Customer service by account type</p>
        <div>
          <p>
            {PLANS.free.label}: {PLANS.free.support.label}{" "}
            <Stars value={PLANS.free.support.stars} />
          </p>
          <p className="text-xs text-mute">
            {PLANS.free.support.responseTime}. {PLANS.free.support.channels}.
          </p>
        </div>
        <div>
          <p>
            {PLANS.premium.label}: {PLANS.premium.support.label}{" "}
            <Stars value={PLANS.premium.support.stars} />
          </p>
          <p className="text-xs text-mute">
            {PLANS.premium.support.responseTime}.{" "}
            {PLANS.premium.support.channels}.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/login" className="btn-primary">
          Sign in to Support
        </Link>
      </div>
    </div>
  );
}
