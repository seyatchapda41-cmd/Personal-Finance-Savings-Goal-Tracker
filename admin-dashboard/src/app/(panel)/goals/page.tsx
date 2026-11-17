import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDeleteGoalAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { GoalCreateForm } from "@/components/admin/goal-create-form";
import { Badge, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { loadAdminSnapshot } from "@/lib/admin/data";
import { goalInsights } from "@/lib/admin/insights";
import { can } from "@/lib/admin/rbac";
import { getAdminSession } from "@/lib/admin/session";
import { formatMoney } from "@/lib/format";

export default async function AdminGoalsPage() {
  const session = await getAdminSession();
  if (!session || !can(session.role, "transactions.view")) notFound();

  const snapshot = await loadAdminSnapshot();
  const goals = goalInsights(snapshot.goals, snapshot.clients);
  const mayManage = can(session.role, "goals.manage");
  const saved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const target = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saving goals"
        description="Every client target, how far it has gone, and how much is still needed."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="ad-muted text-xs uppercase tracking-wide">Goals</p>
          <p className="mt-2 text-2xl font-semibold">{goals.length}</p>
        </Card>
        <Card>
          <p className="ad-muted text-xs uppercase tracking-wide">Saved</p>
          <p className="mt-2 text-2xl font-semibold">{formatMoney(saved)}</p>
        </Card>
        <Card>
          <p className="ad-muted text-xs uppercase tracking-wide">Still to save</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatMoney(Math.max(0, target - saved))}
          </p>
        </Card>
      </div>

      {mayManage && snapshot.clients.length > 0 ? (
        <Card>
          <h3 className="font-semibold">Create a goal</h3>
          <GoalCreateForm clients={snapshot.clients} />
        </Card>
      ) : null}

      {goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="When a client sets a target, it appears here with progress and the amount still to save."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{goal.title}</h3>
                  <p className="ad-muted mt-1 text-sm">
                    {goal.clientName} · due {goal.targetDate}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {goal.overdue ? <Badge tone="bad">Overdue</Badge> : null}
                  {goal.dueSoon ? <Badge tone="warn">Due soon</Badge> : null}
                  {goal.progress >= 100 ? <Badge tone="good">Reached</Badge> : null}
                </div>
              </div>
              <p className="text-sm">
                {formatMoney(goal.currentAmount)} of {formatMoney(goal.targetAmount)} ·{" "}
                {Math.round(goal.progress)}% · {formatMoney(goal.remaining)} left
              </p>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ background: "var(--ad-surface-2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${goal.progress}%`,
                    background: goal.overdue ? "var(--ad-bad)" : "var(--ad-brand)",
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/clients/${goal.clientId}`} className="ad-btn">
                  Open client
                </Link>
                {mayManage ? (
                  <ActionButton
                    action={adminDeleteGoalAction}
                    fields={{ id: goal.id }}
                    label="Delete"
                    confirmLabel="Confirm delete"
                    className="ad-btn ad-btn-danger"
                    confirm
                  />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
