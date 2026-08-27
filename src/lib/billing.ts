export const PREMIUM_RECEIPT_COOKIE = "tempora_premium_receipt";

// A receipt only proves payment for the next 30 minutes, long enough to finish
// creating the account it was bought for.
export const RECEIPT_TTL_SECONDS = 60 * 30;

export type PremiumReceipt = {
  ref: string;
  paidAt: string;
  amount: string;
  cardLast4: string;
};

export type CardInput = {
  name: string;
  number: string;
  expiry: string;
  cvc: string;
};

function luhnValid(digits: string) {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

function expiryInFuture(month: number, year: number) {
  const now = new Date();
  const fullYear = 2000 + year;
  const endOfMonth = new Date(fullYear, month, 1);
  return endOfMonth > now;
}

export function validateCard(
  input: CardInput,
): { error: string } | { last4: string } {
  if (!input.name.trim()) return { error: "Enter the name on the card." };

  const digits = input.number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return { error: "Enter a card number with 13 to 19 digits." };
  }
  if (!luhnValid(digits)) {
    return { error: "That card number is not valid. Check the digits." };
  }

  const expiry = input.expiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!expiry) return { error: "Enter the expiry date as MM/YY." };
  const month = Number(expiry[1]);
  const year = Number(expiry[2]);
  if (month < 1 || month > 12) return { error: "Expiry month must be 01 to 12." };
  if (!expiryInFuture(month, year)) return { error: "That card has expired." };

  if (!/^\d{3,4}$/.test(input.cvc.trim())) {
    return { error: "CVC must be 3 or 4 digits." };
  }

  return { last4: digits.slice(-4) };
}

export function createReceiptRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TMP-${stamp}-${noise}`;
}
