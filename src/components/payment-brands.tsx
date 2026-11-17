export const PAYMENT_BRANDS = [
  { id: "visa", label: "Visa", kind: "card" },
  { id: "mastercard", label: "Mastercard", kind: "card" },
  { id: "amex", label: "American Express", kind: "card" },
  { id: "paypal", label: "PayPal", kind: "wallet" },
] as const;

export type PaymentBrandId = (typeof PAYMENT_BRANDS)[number]["id"];

export function isPaymentBrand(value: string): value is PaymentBrandId {
  return PAYMENT_BRANDS.some((brand) => brand.id === value);
}

export function paymentBrandLabel(id: string) {
  return PAYMENT_BRANDS.find((brand) => brand.id === id)?.label ?? "Card";
}

export function PaymentBrandMark({ id }: { id: PaymentBrandId }) {
  if (id === "visa") {
    return (
      <svg viewBox="0 0 72 28" className="h-7 w-16" aria-hidden>
        <rect width="72" height="28" rx="4" fill="#1a1f71" />
        <text
          x="36"
          y="19"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
          fontSize="14"
          fontWeight="700"
          fontStyle="italic"
        >
          VISA
        </text>
      </svg>
    );
  }

  if (id === "mastercard") {
    return (
      <svg viewBox="0 0 72 28" className="h-7 w-16" aria-hidden>
        <rect width="72" height="28" rx="4" fill="#fff" />
        <circle cx="30" cy="14" r="8" fill="#eb001b" />
        <circle cx="42" cy="14" r="8" fill="#f79e1b" />
        <path d="M36 7.6a8 8 0 0 1 0 12.8 8 8 0 0 1 0-12.8z" fill="#ff5f00" />
      </svg>
    );
  }

  if (id === "amex") {
    return (
      <svg viewBox="0 0 72 28" className="h-7 w-16" aria-hidden>
        <rect width="72" height="28" rx="4" fill="#2e77bc" />
        <text
          x="36"
          y="18"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Arial, sans-serif"
          fontSize="11"
          fontWeight="700"
        >
          AMEX
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 72 28" className="h-7 w-16" aria-hidden>
      <rect width="72" height="28" rx="4" fill="#fff" />
      <text
        x="36"
        y="18"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="12"
        fontWeight="700"
      >
        <tspan fill="#003087">Pay</tspan>
        <tspan fill="#009cde">Pal</tspan>
      </text>
    </svg>
  );
}
