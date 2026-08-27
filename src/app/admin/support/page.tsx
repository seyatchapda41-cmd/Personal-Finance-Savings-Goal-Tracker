import { adminSetSupportStatusAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { PLANS, normalizePlan } from "@/lib/plans";

const ORDER = { open: 0, answered: 1, closed: 2 } as const;

export default async function AdminSupportPage() {
  const snapshot = await loadAdminSnapshot();

  // Priority service first, then oldest waiting.
  const queue = [...snapshot.support].sort((a, b) => {
    const byStatus =
      (ORDER[a.status as keyof typeof ORDER] ?? 3) -
      (ORDER[b.status as keyof typeof ORDER] ?? 3);
    if (byStatus !== 0) return byStatus;
    if (a.priority !== b.priority) return a.priority === "priority" ? -1 : 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Support queue</h1>
        <p className="mt-2 text-sm text-mute">
          Priority requests from Premium accounts come first.
        </p>
      </header>

      {queue.length === 0 ? (
        <p className="card text-sm">
          Nothing waiting. Requests clients send from Support arrive here.
        </p>
      ) : (
        <div className="space-y-4">
          {queue.map((item) => (
            <article key={item.ref} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{item.subject}</h2>
                  <p className="mt-1 text-xs text-mute">
                    {item.ref} · {item.phone} ·{" "}
                    {PLANS[normalizePlan(item.plan)].label} ·{" "}
                    {item.priority === "priority"
                      ? "same working day"
                      : "2 working days"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-azure-strong">
                  {item.status}
                </span>
              </div>

              <p className="text-sm whitespace-pre-wrap">{item.message}</p>

              {item.callbackRequested ? (
                <p className="text-sm">
                  Asked for a phone call-back on {item.phone}.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {item.status !== "answered" ? (
                  <ActionButton
                    action={adminSetSupportStatusAction}
                    fields={{ ref: item.ref, status: "answered" }}
                    label="Mark answered"
                  />
                ) : null}
                {item.status !== "closed" ? (
                  <ActionButton
                    action={adminSetSupportStatusAction}
                    fields={{ ref: item.ref, status: "closed" }}
                    label="Close"
                  />
                ) : null}
                {item.status !== "open" ? (
                  <ActionButton
                    action={adminSetSupportStatusAction}
                    fields={{ ref: item.ref, status: "open" }}
                    label="Reopen"
                  />
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
