"use client";

import { useState } from "react";
import { ChatThread } from "@/components/chat-thread";
import { ClientSupportReplyForm } from "@/components/client-support-reply-form";
import type { ClientSupportThread } from "@/lib/support-inbox";

export function ClientSupportThreads({
  threads,
}: {
  threads: ClientSupportThread[];
}) {
  const [open, setOpen] = useState<string | null>(threads[0]?.ref ?? null);

  if (threads.length === 0) return null;

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">Your conversations</h2>
        <p className="mt-1 text-sm text-mute">
          Replies from customer service appear here. Open a thread to keep talking.
        </p>
      </header>
      <ul className="space-y-3">
        {threads.map((thread) => {
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
                    {thread.ref} · {thread.status}
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
