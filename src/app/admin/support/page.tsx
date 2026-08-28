import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSetSupportStatusAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { AdminSupportReplyForm } from "@/components/admin/support-reply-form";
import { ChatThread } from "@/components/chat-thread";
import { Badge, EmptyState, PageHeader } from "@/components/admin/ui";
import { loadAdminSnapshot, type AdminSupportItem } from "@/lib/admin/data";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { PLANS, normalizePlan } from "@/lib/plans";
import {
  conversationMessages,
  lastMessagePreview,
  type SupportChatMessage,
} from "@/lib/support";

const ORDER = { open: 0, answered: 1, closed: 2 } as const;

function messagesFor(item: AdminSupportItem): SupportChatMessage[] {
  return conversationMessages(
    {
      id: `${item.id}-open`,
      authorType: "client",
      authorLabel: item.fullName || item.phone || "Client",
      body: item.message,
      createdAt: item.createdAt,
    },
    item.replies.map((reply) => ({
      id: reply.id,
      authorType: reply.authorType,
      authorLabel: reply.authorLabel,
      body: reply.body,
      createdAt: reply.createdAt,
    })),
  );
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const session = await getAdminSession();
  if (!session || !can(session.role, "support.view")) notFound();

  const { thread } = await searchParams;
  const snapshot = await loadAdminSnapshot();
  const mayManage = can(session.role, "support.manage");

  const queue = [...snapshot.support].sort((a, b) => {
    const byStatus =
      (ORDER[a.status as keyof typeof ORDER] ?? 3) -
      (ORDER[b.status as keyof typeof ORDER] ?? 3);
    if (byStatus !== 0) return byStatus;
    if (a.priority !== b.priority) return a.priority === "priority" ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const selected =
    queue.find((item) => item.ref === thread) ?? queue[0] ?? null;
  const selectedMessages = selected ? messagesFor(selected) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Read what the client wrote, then reply as customer service. The client sees your answer in their Support page."
      />

      {queue.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="When a client writes from Support, the thread appears here."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] lg:items-start">
          <aside className="ad-card overflow-hidden p-0">
            <p className="ad-muted border-b px-4 py-3 text-xs font-medium uppercase tracking-wide"
              style={{ borderColor: "var(--ad-border)" }}
            >
              {queue.length} conversation{queue.length === 1 ? "" : "s"}
            </p>
            <ul className="max-h-[70vh] overflow-y-auto">
              {queue.map((item) => {
                const messages = messagesFor(item);
                const last = messages[messages.length - 1];
                const waiting =
                  item.status === "open" && last?.authorType === "client";
                const active = selected?.ref === item.ref;
                return (
                  <li key={item.ref}>
                    <Link
                      href={`/admin/support?thread=${encodeURIComponent(item.ref)}`}
                      className="block px-4 py-3 no-underline transition"
                      style={{
                        background: active ? "var(--ad-brand-soft)" : undefined,
                        borderLeft: active
                          ? "3px solid var(--ad-brand)"
                          : "3px solid transparent",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium">
                          {item.fullName || item.phone || "Client"}
                        </p>
                        <div className="flex shrink-0 gap-1">
                          {item.priority === "priority" ? (
                            <Badge tone="brand">Priority</Badge>
                          ) : null}
                          <Badge
                            tone={
                              item.status === "open"
                                ? "warn"
                                : item.status === "answered"
                                  ? "good"
                                  : "neutral"
                            }
                          >
                            {waiting ? "Waiting" : item.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-0.5 truncate text-sm">{item.subject}</p>
                      <p className="ad-muted mt-1 truncate text-xs">
                        {lastMessagePreview(messages)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          {selected ? (
            <section className="ad-card flex min-h-[28rem] flex-col p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{selected.subject}</h3>
                  <p className="ad-muted mt-1 text-sm">
                    {selected.fullName || "Client"}
                    {selected.phone ? ` · ${selected.phone}` : ""}
                    {" · "}
                    {PLANS[normalizePlan(selected.plan)].label}
                    {selected.createdAt
                      ? ` · ${new Date(selected.createdAt).toLocaleString()}`
                      : ""}
                  </p>
                  <p className="ad-muted mt-1 text-xs">
                    Reference <span className="ad-kbd">{selected.ref}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {selected.priority === "priority" ? (
                    <Badge tone="brand">Priority</Badge>
                  ) : null}
                  <Badge
                    tone={
                      selected.status === "open"
                        ? "warn"
                        : selected.status === "answered"
                          ? "good"
                          : "neutral"
                    }
                  >
                    {selected.status}
                  </Badge>
                </div>
              </div>

              {selected.callbackRequested ? (
                <p className="mt-3 text-sm">
                  Asked for a phone call-back on {selected.phone || "their number"}.
                </p>
              ) : null}

              <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <ChatThread
                  messages={selectedMessages}
                  self="staff"
                  variant="admin"
                />
              </div>

              <div
                className="mt-5 space-y-3 border-t pt-4"
                style={{ borderColor: "var(--ad-border)" }}
              >
                {mayManage ? (
                  <>
                    <AdminSupportReplyForm ticketRef={selected.ref} />
                    <div className="flex flex-wrap gap-1.5">
                      {selected.status !== "answered" ? (
                        <ActionButton
                          action={adminSetSupportStatusAction}
                          fields={{ ref: selected.ref, status: "answered" }}
                          label="Mark answered"
                        />
                      ) : null}
                      {selected.status !== "closed" ? (
                        <ActionButton
                          action={adminSetSupportStatusAction}
                          fields={{ ref: selected.ref, status: "closed" }}
                          label="Close"
                        />
                      ) : null}
                      {selected.status !== "open" ? (
                        <ActionButton
                          action={adminSetSupportStatusAction}
                          fields={{ ref: selected.ref, status: "open" }}
                          label="Reopen"
                        />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="ad-muted text-xs">
                    Your role can read the conversation but not reply.
                  </p>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
