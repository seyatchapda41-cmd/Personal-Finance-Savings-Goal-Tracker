"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createReceiptRef, validateCard, type PremiumReceipt } from "@/lib/billing";
import { savePremiumReceipt } from "@/lib/billing-server";
import { isSupabaseConfigured } from "@/lib/config";
import { addDemoPayment } from "@/lib/demo/ledger";
import { applyPlanToCurrentUser } from "@/lib/plan-store";
import { PLANS } from "@/lib/plans";
import { createAdminSupabase } from "@/lib/supabase/admin";

// Every payment is recorded so the founder panel can account for revenue.
async function recordPayment(
  receipt: PremiumReceipt,
  phone: string | null,
  userId: string | null,
) {
  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return;
    await supabase.from("payments").insert({
      ref: receipt.ref,
      user_id: userId,
      phone,
      amount: PLANS.premium.priceAmount,
      amount_label: receipt.amount,
      card_last4: receipt.cardLast4,
    });
    return;
  }
  await addDemoPayment({
    ref: receipt.ref,
    amount: receipt.amount,
    cardLast4: receipt.cardLast4,
    phone,
    paidAt: receipt.paidAt,
    status: "paid",
  });
}

// Stands in for a payment provider. Replace this with a real charge plus a
// provider webhook before taking money: nothing here talks to a card network.
export async function payPremiumAction(formData: FormData) {
  const result = validateCard({
    name: String(formData.get("cardName") ?? ""),
    number: String(formData.get("cardNumber") ?? ""),
    expiry: String(formData.get("cardExpiry") ?? ""),
    cvc: String(formData.get("cardCvc") ?? ""),
  });
  if ("error" in result) return { error: result.error };

  const receipt: PremiumReceipt = {
    ref: createReceiptRef(),
    paidAt: new Date().toISOString(),
    amount: `${PLANS.premium.priceLabel}/month`,
    cardLast4: result.last4,
  };

  // Someone already signed in is upgrading, so apply it to their account now.
  const profile = await getCurrentProfile();

  await recordPayment(receipt, profile?.phone ?? null, profile?.id ?? null);
  if (profile) {
    const applied = await applyPlanToCurrentUser("premium");
    if ("error" in applied) return { error: applied.error };
    redirect("/app/settings");
  }

  // Otherwise the receipt travels to the signup form, which creates the
  // account directly on Premium.
  await savePremiumReceipt(receipt);
  redirect("/signup?plan=premium");
}
