"use client";

import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/components/stars";
import { PLANS } from "@/lib/plans";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-3 text-mute">
        Questions about the product, security, or a private deployment? Send a
        note. If you already have an account, write from{" "}
        <Link href="/app/support" className="text-azure">
          Support inside the app
        </Link>{" "}
        so your request arrives with your service level.
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
      {sent ? (
        <p className="card mt-8 text-sm">Thanks. We will reply to the email you provided.</p>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSent(true);
          }}
        >
          <label className="block text-sm">
            Name
            <input className="input mt-1" name="name" required />
          </label>
          <label className="block text-sm">
            Email
            <input className="input mt-1" type="email" name="email" required />
          </label>
          <label className="block text-sm">
            Message
            <textarea className="input mt-1 min-h-32" name="message" required />
          </label>
          <button className="btn-primary" type="submit">
            Send
          </button>
        </form>
      )}
    </div>
  );
}
