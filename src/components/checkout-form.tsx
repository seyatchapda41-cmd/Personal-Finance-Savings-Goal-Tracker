"use client";

import { useState } from "react";

export function CheckoutForm({
  action,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        if (result?.error) setError(result.error);
        setPending(false);
      }}
    >
      <label className="block text-sm">
        Name on card
        <input className="input mt-1" name="cardName" required autoComplete="cc-name" />
      </label>
      <label className="block text-sm">
        Card number
        <input
          className="input mt-1"
          name="cardNumber"
          required
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="XXXX XXXX XXXX XXXX"
        />
        <span className="mt-1 block text-xs text-mute">
          No real charge is made in this build.
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Expiry (MM/YY)
          <input
            className="input mt-1"
            name="cardExpiry"
            required
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="XX/XX"
          />
        </label>
        <label className="block text-sm">
          CVC
          <input
            className="input mt-1"
            name="cardCvc"
            required
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="XXX"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Processing payment…" : submitLabel}
      </button>
    </form>
  );
}
