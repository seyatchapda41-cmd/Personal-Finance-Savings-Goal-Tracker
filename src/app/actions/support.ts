"use server";

import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { addDemoSupport } from "@/lib/demo/ledger";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createTicketRef,
  priorityFor,
  supportTargetFor,
  validateSupportRequest,
} from "@/lib/support";

export async function sendSupportMessageAction(formData: FormData): Promise<{
  error?: string;
  ref?: string;
  target?: string;
}> {
  const request = {
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
    callbackRequested: formData.get("callback") === "on",
  };

  const problem = validateSupportRequest(request);
  if (problem) return { error: problem };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." };

  const ref = createTicketRef();
  const priority = priorityFor(profile.plan);

  // A call-back is part of the Premium service level only.
  const callbackRequested =
    request.callbackRequested && profile.plan === "premium";

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const { error } = await supabase.from("support_messages").insert({
      user_id: profile.id,
      ref,
      plan: profile.plan,
      priority,
      subject: request.subject.trim(),
      message: request.message.trim(),
      callback_requested: callbackRequested,
    });
    if (error) return { error: `The request could not be sent: ${error.message}` };
  } else {
    await addDemoSupport({
      ref,
      phone: profile.phone,
      plan: profile.plan,
      priority,
      subject: request.subject.trim(),
      message: request.message.trim(),
      callbackRequested,
      status: "open",
      createdAt: new Date().toISOString(),
    });
  }

  return { ref, target: supportTargetFor(profile.plan) };
}
