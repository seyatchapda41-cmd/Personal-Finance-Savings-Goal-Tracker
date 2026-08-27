import { isSupabaseConfigured } from "@/lib/config";
import { updateDemoPayment } from "@/lib/demo/ledger";
import { createAdminSupabase } from "@/lib/supabase/admin";

// Checkout happens before the account exists, so the payment row is linked to
// the phone number once signup completes.
export async function attachPaymentToPhone(ref: string, phone: string) {
  if (isSupabaseConfigured()) {
    const supabase = createAdminSupabase();
    if (!supabase) return;
    await supabase.from("payments").update({ phone }).eq("ref", ref);
    return;
  }
  await updateDemoPayment(ref, { phone });
}
