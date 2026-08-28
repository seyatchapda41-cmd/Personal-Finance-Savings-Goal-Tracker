import type { SupportChatMessage } from "@/lib/support";

export function ChatThread({
  messages,
  self,
  variant,
}: {
  messages: SupportChatMessage[];
  self: "client" | "staff";
  variant: "admin" | "app";
}) {
  if (messages.length === 0) return null;

  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const mine = message.authorType === self;
        const staff = message.authorType === "staff";
        return (
          <li
            key={message.id}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                variant === "app"
                  ? mine
                    ? "bg-azure/15"
                    : "border border-line bg-page"
                  : ""
              }`}
              style={
                variant === "admin"
                  ? {
                      background: mine
                        ? "var(--ad-brand-soft)"
                        : "var(--ad-surface-2)",
                    }
                  : undefined
              }
            >
              <p
                className={`text-xs font-medium ${
                  variant === "admin" ? "ad-muted" : "text-mute"
                }`}
              >
                {staff && variant === "app"
                  ? "Customer service"
                  : message.authorLabel}
                {message.createdAt
                  ? ` · ${new Date(message.createdAt).toLocaleString()}`
                  : ""}
              </p>
              <p
                className={`mt-1 whitespace-pre-wrap text-sm ${
                  variant === "admin" ? "ad-soft" : ""
                }`}
              >
                {message.body}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
