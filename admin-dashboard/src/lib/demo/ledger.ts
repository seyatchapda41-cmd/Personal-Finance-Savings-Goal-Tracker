import { cookies } from "next/headers";

// Demo mode has no database. Payments and support requests are kept in cookies
// so the founder panel has real rows to work with on this machine.
const PAYMENTS_COOKIE = "tempora_payments";
const SUPPORT_COOKIE = "tempora_support";
const MAX_ROWS = 50;

export type LedgerPayment = {
  ref: string;
  amount: string;
  cardLast4: string;
  phone: string | null;
  paidAt: string;
  status: "paid" | "refunded";
};

export type LedgerSupportReply = {
  id: string;
  authorType: "client" | "staff";
  authorLabel: string;
  body: string;
  createdAt: string;
};

export type LedgerSupport = {
  ref: string;
  phone: string;
  plan: string;
  priority: string;
  subject: string;
  message: string;
  callbackRequested: boolean;
  status: "open" | "answered" | "closed";
  createdAt: string;
  replies: LedgerSupportReply[];
};

async function read<T>(name: string): Promise<T[]> {
  const store = await cookies();
  const raw = store.get(name)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write<T>(name: string, rows: T[]) {
  const store = await cookies();
  store.set(name, JSON.stringify(rows.slice(0, MAX_ROWS)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function readDemoPayments() {
  return read<LedgerPayment>(PAYMENTS_COOKIE);
}

export async function addDemoPayment(payment: LedgerPayment) {
  const rows = await readDemoPayments();
  await write(PAYMENTS_COOKIE, [payment, ...rows]);
}

export async function updateDemoPayment(
  ref: string,
  patch: Partial<LedgerPayment>,
) {
  const rows = await readDemoPayments();
  await write(
    PAYMENTS_COOKIE,
    rows.map((row) => (row.ref === ref ? { ...row, ...patch } : row)),
  );
}

export function readDemoSupport() {
  return read<LedgerSupport>(SUPPORT_COOKIE);
}

export async function addDemoSupport(request: LedgerSupport) {
  const rows = await readDemoSupport();
  await write(SUPPORT_COOKIE, [{ ...request, replies: request.replies ?? [] }, ...rows]);
}

export async function addDemoSupportReply(
  ref: string,
  reply: LedgerSupportReply,
  status?: LedgerSupport["status"],
) {
  const rows = await readDemoSupport();
  await write(
    SUPPORT_COOKIE,
    rows.map((row) =>
      row.ref === ref
        ? {
            ...row,
            replies: [...(row.replies ?? []), reply],
            status: status ?? row.status,
          }
        : row,
    ),
  );
}

export async function updateDemoSupport(
  ref: string,
  patch: Partial<LedgerSupport>,
) {
  const rows = await readDemoSupport();
  await write(
    SUPPORT_COOKIE,
    rows.map((row) => (row.ref === ref ? { ...row, ...patch } : row)),
  );
}
