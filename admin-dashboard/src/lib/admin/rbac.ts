export type AdminRole = "founder" | "moderator";

// Every action the panel can perform. Naming stays coarse on purpose: one
// permission per thing a person can actually do.
export const PERMISSIONS = [
  "clients.view",
  "clients.suspend",
  "clients.password",
  "clients.plan",
  "clients.delete",
  "transactions.view",
  "transactions.cancel",
  "transactions.edit",
  "transactions.reverse",
  "transactions.adjust",
  "transactions.review",
  "transactions.export",
  "goals.manage",
  "payments.view",
  "payments.refund",
  "support.view",
  "support.manage",
  "audit.view",
  "team.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// A moderator runs the day to day: reads everything, answers support, suspends
// an account, cancels a bad record and flags one for review. Rewriting a
// client's figures, posting corrections, exporting the books, plans, deletions,
// the admin team and platform settings stay with the founder.
const MODERATOR_PERMISSIONS: Permission[] = [
  "clients.view",
  "clients.suspend",
  "transactions.view",
  "transactions.cancel",
  "transactions.review",
  "payments.view",
  "support.view",
  "support.manage",
  "audit.view",
];

export function permissionsFor(role: AdminRole): readonly Permission[] {
  return role === "founder" ? PERMISSIONS : MODERATOR_PERMISSIONS;
}

export function can(role: AdminRole, permission: Permission) {
  return permissionsFor(role).includes(permission);
}

export function isFounder(role: AdminRole) {
  return role === "founder";
}

export const ROLE_LABEL: Record<AdminRole, string> = {
  founder: "Founder",
  moderator: "Moderator",
};

export const ROLE_BLURB: Record<AdminRole, string> = {
  founder: "Full control, including money, platform settings and the admin team.",
  moderator: "Clients, records and support. No billing, settings or team changes.",
};

export function normalizeRole(value: unknown): AdminRole {
  return value === "founder" ? "founder" : "moderator";
}
