"use client";

import { useEffect, useRef, useState } from "react";
import { ChatThread } from "@/components/chat-thread";
import { ClientSupportReplyForm } from "@/components/client-support-reply-form";
import type { ClientSupportThread } from "@/lib/support-inbox";

function waitingLabel(thread: ClientSupportThread) {
  const last = thread.messages[thread.messages.length - 1];
  if (thread.status === "closed") return "Closed";
  if (thread.status === "answered" || last?.authorType === "staff") {
    return "Customer service replied";
  }
  return "Waiting for customer service";
}

function rank(thread: ClientSupportThread) {
  const reset = /password reset/i.test(thread.subject);
  if (reset && thread.status === "open") return 0;
  if (thread.status === "open") return 1;
  if (thread.status === "answered") return 2;
  return 3;
}

export function ClientSupportThreads({
  threads,
}: {
  threads: ClientSupportThread[];
}) {
  const ordered = [...threads].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const [open, setOpen] = useState<string | null>(ordered[0]?.ref ?? null);
  const signature = ordered.map((thread) => thread.ref).join(",");
  const seen = useRef(signature);

  useEffect(() => {
    const previous = new Set(seen.current.split(",").filter(Boolean));
    const fresh = signature.split(",").find((ref) => ref && !previous.has(ref));
    seen.current = signature;
    if (fresh) setOpen(fresh);
  }, [signature]);

  if (threads.length === 0) return null;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Your conversations</h2>
        <p className="mt-1 text-sm text-mute">
          Customer service reads this on the admin Conversations page. A reply
          shows here while you leave this page open.
        </p>
      </header>
      <ul className="space-y-3">
        {ordered.map((thread) => {
          const expanded = open === thread.ref;
          const last = thread.messages[thread.messages.length - 1];
          return (
            <li key={thread.ref} className="card space-y-4">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => setOpen(expanded ? null : thread.ref)}
              >
                <span>
                  <span className="block font-medium">{thread.subject}</span>
                  <span className="mt-1 block text-xs text-mute">
                    {thread.ref} · {waitingLabel(thread)}
                    {last
                      ? ` · ${last.authorType === "staff" ? "Customer service" : "You"}: ${last.body.replace(/\s+/g, " ").slice(0, 70)}`
                      : ""}
                  </span>
                </span>
                <span className="text-xs text-mute">
                  {expanded ? "Hide" : "Open"}
                </span>
              </button>
              {expanded ? (
                <>
                  <ChatThread
                    messages={thread.messages}
                    self="client"
                    variant="app"
                  />
                  {thread.status === "closed" ? (
                    <p className="text-sm text-mute">
                      This conversation is closed. Send a new request if you still
                      need help.
                    </p>
                  ) : (
                    <ClientSupportReplyForm ticketRef={thread.ref} />
                  )}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
