"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { PHONE_HINT } from "@/lib/phone";
import { resetPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">Recover access</h1>
      <p className="mt-2 text-sm text-mute">
        Enter the phone number on your account. Customer service checks the
        request and sets a new password for you, then passes it on.
      </p>
      <form
        className="mt-8 space-y-4"
        action={async (formData) => {
          setError(null);
          const result = await resetPasswordAction(formData);
          if (result.error) setError(result.error);
          else
            setMessage(
              "Request received. If that number holds an account, customer service will be in touch with a new password.",
            );
        }}
      >
        <label className="block text-sm">
          Phone number
          <input
            className="input mt-1"
            type="tel"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
          />
          <span className="mt-1 block text-xs text-mute">{PHONE_HINT}</span>
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-azure">{message}</p> : null}
        <button className="btn-primary w-full" type="submit">
          Continue
        </button>
      </form>
      <Link href="/login" className="mt-6 text-sm text-azure">
        Back to login
      </Link>
    </div>
  );
}
