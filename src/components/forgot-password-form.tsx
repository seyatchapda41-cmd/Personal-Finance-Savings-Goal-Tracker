"use client";

import Link from "next/link";
import { useState } from "react";
import { VisibleField } from "@/components/visible-field";
import { PHONE_HINT } from "@/lib/phone";
import { resetPasswordAction } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  return (
    <>
      <form
        className="space-y-4"
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
        <VisibleField
          label="Phone number"
          name="phone"
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          hint={PHONE_HINT}
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-azure">{message}</p> : null}
        <button className="btn-primary w-full" type="submit">
          Continue
        </button>
      </form>
      <Link href="/login" className="mt-6 inline-block text-sm text-azure">
        Back to login
      </Link>
    </>
  );
}
