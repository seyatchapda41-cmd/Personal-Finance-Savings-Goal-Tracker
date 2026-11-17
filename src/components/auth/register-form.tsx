"use client";

import { useState } from "react";
import { AuthIdentityCard } from "@/components/auth/auth-identity-card";
import { Notice } from "@/components/notice";
import { VisibleField } from "@/components/visible-field";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_HINT,
  validatePassword,
} from "@/lib/password";
import { PHONE_HINT } from "@/lib/phone";

export function RegisterForm({
  action,
  extraFields,
  footer,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  extraFields?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const passwordProblem = password ? validatePassword(password) : null;

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const problem = validatePassword(String(formData.get("password") ?? ""));
        if (problem) {
          setError(problem);
          return;
        }
        setPending(true);
        setError(null);
        const result = await action(formData);
        if (result?.error) setError(result.error);
        setPending(false);
      }}
    >
      {extraFields}
      <AuthIdentityCard
        fullName={fullName}
        phone={phone}
        email={email}
        caption="This is how your account will look on this device after you register."
      />
      <VisibleField
        label="Full name"
        name="fullName"
        required
        autoComplete="name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />
      <VisibleField
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        hint="For receipts and recovery. Login uses your phone number."
      />
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
      <VisibleField
        label="Password"
        name="password"
        type="password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        hint={passwordProblem ?? PASSWORD_HINT}
      />
      {error ? <Notice tone="bad">{error}</Notice> : null}
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      {footer}
    </form>
  );
}
