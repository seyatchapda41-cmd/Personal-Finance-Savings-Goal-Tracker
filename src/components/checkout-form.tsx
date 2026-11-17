"use client";

import { useState } from "react";
import {
  PAYMENT_BRANDS,
  PaymentBrandMark,
  type PaymentBrandId,
} from "@/components/payment-brands";
import { VisibleField } from "@/components/visible-field";

export function CheckoutForm({
  action,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [brand, setBrand] = useState<PaymentBrandId>("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const wallet = brand === "paypal";

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
      <fieldset>
        <legend className="text-sm font-medium">Pay with</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PAYMENT_BRANDS.map((item) => {
            const selected = brand === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                  selected ? "border-azure bg-azure-soft" : "border-line bg-card"
                }`}
                onClick={() => setBrand(item.id)}
              >
                <PaymentBrandMark id={item.id} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <input type="hidden" name="brand" value={brand} />

      {wallet ? (
        <VisibleField
          label="PayPal email"
          name="paypalEmail"
          type="email"
          required
          autoComplete="email"
          value={paypalEmail}
          onChange={(event) => setPaypalEmail(event.target.value)}
          hint="No real charge is made in this build."
        />
      ) : (
        <>
          <VisibleField
            label="Card number"
            name="cardNumber"
            required
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="XXXX XXXX XXXX XXXX"
            value={cardNumber}
            onChange={(event) => setCardNumber(event.target.value)}
            hint="No real charge is made in this build."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <VisibleField
              label="Expiry (MM/YY)"
              name="cardExpiry"
              required
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="XX/XX"
              value={cardExpiry}
              onChange={(event) => setCardExpiry(event.target.value)}
            />
            <VisibleField
              label="CVC"
              name="cardCvc"
              secret
              required
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={brand === "amex" ? "XXXX" : "XXX"}
              value={cardCvc}
              onChange={(event) => setCardCvc(event.target.value)}
            />
          </div>
        </>
      )}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Processing payment…" : submitLabel}
      </button>
    </form>
  );
}
