"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { addDemoSupport, addDemoSupportReply, readDemoSupport } from "@/lib/demo/ledger";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  createTicketRef,
  priorityFor,
  supportTargetFor,
  validateSupportReply,
  validateSupportRequest,
} from "@/lib/support";

function refreshSupport() {
  revalidatePath("/app/support");
}

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
      replies: [],
    });
  }

  refreshSupport();
  return { ref, target: supportTargetFor(profile.plan) };
}

export async function replySupportAction(formData: FormData): Promise<{
  error?: string;
  ok?: true;
}> {
  const ref = String(formData.get("ref") ?? "");
  const body = String(formData.get("body") ?? "");
  const problem = validateSupportReply(body);
  if (!ref) return { error: "That conversation could not be found." };
  if (problem) return { error: problem };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "You are not signed in." };

  const label = profile.fullName || "You";

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "Supabase is not available." };
    const { data: ticket } = await supabase
      .from("support_messages")
      .select("id, status")
      .eq("ref", ref)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!ticket) return { error: "That conversation could not be found." };
    if (ticket.status === "closed") {
      return { error: "This conversation is closed. Open a new request if you still need help." };
    }
    const { error } = await supabase.from("support_replies").insert({
      ticket_id: ticket.id,
      author_type: "client",
      author_label: label,
      body: body.trim(),
    });
    if (error) return { error: `The reply could not be sent: ${error.message}` };
    await supabase
      .from("support_messages")
      .update({ status: "open" })
      .eq("id", ticket.id);
  } else {
    const ticket = (await readDemoSupport()).find(
      (row) => row.ref === ref && row.phone === profile.phone,
    );
    if (!ticket) return { error: "That conversation could not be found." };
    if (ticket.status === "closed") {
      return { error: "This conversation is closed. Open a new request if you still need help." };
    }
    await addDemoSupportReply(
      ref,
      {
        id: `SR-${Date.now().toString(36)}`,
        authorType: "client",
        authorLabel: label,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      },
      "open",
    );
  }

  refreshSupport();
  return { ok: true };
}
