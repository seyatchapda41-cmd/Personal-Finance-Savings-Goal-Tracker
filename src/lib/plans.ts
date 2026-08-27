import type { Plan } from "@/lib/types";

export const SUPPORT_MAX_STARS = 5;

export type PlanSupport = {
  stars: number;
  label: string;
  responseTime: string;
  channels: string;
};

export type PlanLimits = {
  label: string;
  priceLabel: string;
  priceAmount: number;
  monthlyTransactions: number | null;
  goals: number | null;
  categories: number | null;
  csvExport: boolean;
  fullHistory: boolean;
  support: PlanSupport;
  blurb: string;
  features: string[];
};

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    label: "Standard",
    priceLabel: "$0",
    priceAmount: 0,
    monthlyTransactions: 50,
    goals: 2,
    categories: 12,
    csvExport: false,
    fullHistory: false,
    support: {
      stars: 3,
      label: "Standard customer service",
      responseTime: "Replies within 2 working days",
      channels: "Email and the contact form",
    },
    blurb: "Everything an individual needs to start tracking.",
    features: [
      "Up to 50 transactions per month",
      "2 savings goals",
      "12 categories",
      "Current month dashboard",
      "Customer service: 3 of 5 stars",
    ],
  },
  premium: {
    label: "Premium",
    priceLabel: "$20.99",
    priceAmount: 20.99,
    monthlyTransactions: null,
    goals: null,
    categories: null,
    csvExport: true,
    fullHistory: true,
    support: {
      stars: 5,
      label: "Priority customer service",
      responseTime: "Replies the same working day",
      channels: "Email, contact form and phone call-back",
    },
    blurb: "For people running a real budget every month.",
    features: [
      "Unlimited transactions",
      "Unlimited savings goals",
      "Unlimited categories",
      "Full history and per-month breakdowns",
      "CSV export",
      "Customer service: 5 of 5 stars",
    ],
  },
};

export function normalizePlan(value: unknown): Plan {
  return value === "premium" ? "premium" : "free";
}

export function limitsFor(plan: Plan) {
  return PLANS[plan];
}

export function limitMessage(
  what: "transactions" | "goals" | "categories",
  limit: number,
  plan: Plan = "free",
) {
  const noun =
    what === "transactions"
      ? `${limit} transactions per month`
      : what === "goals"
        ? `${limit} savings goals`
        : `${limit} categories`;
  if (plan === "premium") {
    return `The Premium plan allows ${noun}. Remove one to add another.`;
  }
  return `The Standard plan allows ${noun}. Upgrade to Premium in Settings for more.`;
}
