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

export function createTicketRef() {
  const stamp = Date.now().toString(36).toUpperCase();
  const noise = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `CS-${stamp}-${noise}`;
}
