import { PLANS } from "@/lib/plans";
import type { Plan } from "@/lib/types";

export type SupportRequest = {
  subject: string;
  message: string;
  callbackRequested: boolean;
};

export function supportTargetFor(plan: Plan) {
  return PLANS[plan].support.responseTime;
}

export function priorityFor(plan: Plan) {
  return plan === "premium" ? "priority" : "standard";
}

export function validateSupportRequest(
  request: SupportRequest,
): string | null {
  if (request.subject.trim().length < 3) {
    return "Give the request a subject of at least 3 characters.";
  }
  if (request.message.trim().length < 20) {
    return "Describe the problem in at least 20 characters so we can help.";
  }
  return null;
}

export type SupportChatMessage = {
  id: string;
  authorType: "client" | "staff";
  authorLabel: string;
  body: string;
  createdAt: string;
};

export function validateSupportReply(body: string): string | null {
  if (body.trim().length < 2) {
    return "Write a short reply so the other side can read it.";
  }
  if (body.trim().length > 4000) {
    return "Keep the reply under 4000 characters.";
  }
  return null;
}

export function conversationMessages(
  opener: SupportChatMessage,
  replies: SupportChatMessage[],
): SupportChatMessage[] {
  return [opener, ...replies].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function lastMessagePreview(messages: SupportChatMessage[]) {
  const last = messages[messages.length - 1];
  if (!last) return "";
  const text = last.body.replace(/\s+/g, " ").trim();
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

export function createTicketRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CS-${stamp}-${noise}`;
}
