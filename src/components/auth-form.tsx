"use client";

import { useState } from "react";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_HINT,
  validatePassword,
} from "@/lib/password";
import { PHONE_HINT } from "@/lib/phone";

export function AuthForm({
  action,
  submitLabel,
  extraFields,
  nextPath,
  footer,
  newPassword = false,
  defaultPhone,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
  extraFields?: React.ReactNode;
  nextPath?: string;
  footer?: React.ReactNode;
  newPassword?: boolean;
  defaultPhone?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");

  // Only a new password has to satisfy the rules; an existing one is checked
  // by whoever stored it.
  const passwordProblem =
    newPassword && password ? validatePassword(password) : null;

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const problem = newPassword
          ? validatePassword(String(formData.get("password") ?? ""))
          : null;
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
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {extraFields}
      <label className="block text-sm">
        Phone number
        <input
          key={defaultPhone}
          className="input mt-1"
          type="tel"
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          defaultValue={defaultPhone}
        />
        <span className="mt-1 block text-xs text-mute">{PHONE_HINT}</span>
      </label>
      <label className="block text-sm">
        Password
        <input
          className="input mt-1"
          type="password"
          name="password"
          required
          minLength={newPassword ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={newPassword ? "new-password" : "current-password"}
          onChange={
            newPassword
              ? (event) => setPassword(event.target.value)
              : undefined
          }
        />
        {newPassword ? (
          <span
            className={`mt-1 block text-xs ${
              passwordProblem ? "text-rose-600" : "text-mute"
            }`}
          >
            {passwordProblem ?? PASSWORD_HINT}
          </span>
        ) : null}
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </button>
      {footer}
    </form>
  );
}
