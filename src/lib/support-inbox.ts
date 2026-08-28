import { getCurrentProfile } from "@/lib/auth/profile";
import { isSupabaseConfigured } from "@/lib/config";
import { readDemoSupport } from "@/lib/demo/ledger";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  conversationMessages,
  type SupportChatMessage,
} from "@/lib/support";

export type ClientSupportThread = {
  id: string;
  ref: string;
  subject: string;
  status: string;
  priority: string;
  plan: string;
  callbackRequested: boolean;
  createdAt: string;
  messages: SupportChatMessage[];
};

function opener(
  id: string,
  body: string,
  createdAt: string,
  label: string,
): SupportChatMessage {
  return {
    id: `${id}-open`,
    authorType: "client",
    authorLabel: label,
    body,
    createdAt,
  };
}

export async function loadClientSupportThreads(): Promise<ClientSupportThread[]> {
  const profile = await getCurrentProfile();
  if (!profile) return [];
  const label = profile.fullName || "You";

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabase();
    if (!supabase) return [];
    const { data: tickets } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    const rows = tickets ?? [];
    if (rows.length === 0) return [];

    const { data: replies } = await supabase
      .from("support_replies")
      .select("*")
      .in(
        "ticket_id",
        rows.map((row) => row.id),
      )
      .order("created_at", { ascending: true });

    const byTicket = new Map<string, SupportChatMessage[]>();
    for (const row of replies ?? []) {
      const ticketId = String(row.ticket_id);
      const list = byTicket.get(ticketId) ?? [];
      list.push({
        id: String(row.id),
        authorType: row.author_type === "staff" ? "staff" : "client",
        authorLabel: String(row.author_label ?? "Customer service"),
        body: String(row.body ?? ""),
        createdAt: String(row.created_at ?? ""),
      });
      byTicket.set(ticketId, list);
    }

    return rows.map((row) => {
      const id = String(row.id);
      return {
        id,
        ref: String(row.ref),
        subject: String(row.subject ?? ""),
        status: String(row.status ?? "open"),
        priority: String(row.priority ?? "standard"),
        plan: String(row.plan ?? "free"),
        callbackRequested: Boolean(row.callback_requested),
        createdAt: String(row.created_at ?? ""),
        messages: conversationMessages(
          opener(id, String(row.message ?? ""), String(row.created_at ?? ""), label),
          byTicket.get(id) ?? [],
        ),
      };
    });
  }

  const rows = await readDemoSupport();
  return rows
    .filter((row) => row.phone === profile.phone)
    .map((row) => ({
      id: row.ref,
      ref: row.ref,
      subject: row.subject,
      status: row.status,
      priority: row.priority,
      plan: row.plan,
      callbackRequested: row.callbackRequested,
      createdAt: row.createdAt,
      messages: conversationMessages(
        opener(row.ref, row.message, row.createdAt, label),
        (row.replies ?? []).map((reply) => ({
          id: reply.id,
          authorType: reply.authorType,
          authorLabel: reply.authorLabel,
          body: reply.body,
          createdAt: reply.createdAt,
        })),
      ),
    }));
}
