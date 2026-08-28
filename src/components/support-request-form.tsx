"use client";

import Link from "next/link";
import { useState } from "react";
import { sendSupportMessageAction } from "@/app/actions/support";
import { Stars } from "@/components/stars";
import { useFinance } from "@/lib/finance-context";
import { PLANS } from "@/lib/plans";

export function SupportRequestForm() {
  const { ready, plan, limits, snapshot } = useFinance();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ ref: string; target: string } | null>(null);
  const [pending, setPending] = useState(false);

  if (!ready) return <p className="text-sm text-mute">Loading…</p>;

  const isPremium = plan === "premium";
  const support = limits.support;

  return (
    <div className="space-y-6">
      <section className="card">
        <p className="text-sm">
          {support.label} <Stars value={support.stars} />
        </p>
        <p className="mt-1 text-sm text-mute">
          {support.responseTime}. {support.channels}.
        </p>
        {!isPremium ? (
          <p className="mt-3 text-xs text-mute">
            Premium is answered the same working day and can ask for a phone
            call-back.{" "}
            <Link href="/app/premium" className="text-azure">
              See the Premium pass
            </Link>
          </p>
        ) : null}
      </section>

      {sent ? (
        <section className="card space-y-3">
          <h2 className="font-semibold">Request sent</h2>
          <p className="text-sm">
            Your reference is <span className="font-medium">{sent.ref}</span>.
            Customer service will reply in this page.
          </p>
          <p className="text-sm text-mute">{sent.target}.</p>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setSent(null)}
          >
            Send another request
          </button>
        </section>
      ) : (
        <form
          className="card space-y-4"
          action={async (formData) => {
            setPending(true);
            setError(null);
            const result = await sendSupportMessageAction(formData);
            if (result.error) setError(result.error);
            else if (result.ref && result.target) {
              setSent({ ref: result.ref, target: result.target });
            }
            setPending(false);
          }}
        >
          <label className="block text-sm">
            Subject
            <input className="input mt-1" name="subject" required />
          </label>
          <label className="block text-sm">
            What is happening?
            <textarea
              className="input mt-1 min-h-40"
              name="message"
              required
              placeholder="Describe the problem, and what you expected instead."
            />
          </label>
          {isPremium ? (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="callback" className="mt-1" />
              <span>
                Call me back on {snapshot.profile.phone} instead of only
                replying here.
              </span>
            </label>
          ) : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send to customer service"}
          </button>
          <p className="text-xs text-mute">
            Sent as {snapshot.profile.fullName} · {PLANS[plan].label} account ·{" "}
            {support.responseTime.toLowerCase()}
          </p>
        </form>
      )}
    </div>
  );
}
