import { PLANS } from "@/lib/plans";

export const FEATURES = [
  {
    title: "Transactions",
    body: "Log income and expenses with amount, date, category, and a note. Totals update as soon as you save.",
  },
  {
    title: "Categories",
    body: "Split money your way: salary, rent, food, savings. Income and expense stay separate so the dashboard stays honest.",
  },
  {
    title: "Savings goals",
    body: "Name a target, a date, and how much is already set aside. Watch the bar fill in as you add to it.",
  },
  {
    title: "Dashboard",
    body: "See this month’s income, expenses, profit, and goal progress without rebuilding a spreadsheet.",
  },
  {
    title: "Phone login",
    body: "Your phone number is the credential. Email is only for receipts and recovery.",
  },
  {
    title: "Your look",
    body: "Theme, typeface, and night mode stay on this device — including a warning before the page goes dark.",
  },
] as const;

export const STEPS = [
  {
    title: "Create an account",
    body: "Sign up with your phone number and a password. Standard is free; Premium can be paid first.",
  },
  {
    title: "Set categories",
    body: "Start from sensible defaults, then rename or add your own for income and expenses.",
  },
  {
    title: "Log money as it moves",
    body: "Add a transaction when cash comes in or goes out. The month totals refresh immediately.",
  },
  {
    title: "Name a savings goal",
    body: "Give it a target in FCFA and a date you care about. Update what you have already saved.",
  },
  {
    title: "Check the dashboard",
    body: "See monthly health, recent activity, and how close each goal is — on your phone or at a desk.",
  },
] as const;

export const TRUST = [
  {
    value: PLANS.free.priceLabel,
    label: "Standard plan",
    hint: "Everyday tracking, free forever.",
  },
  {
    value: `${PLANS.premium.priceLabel}/mo`,
    label: "Premium",
    hint: "Unlimited books and same-day support.",
  },
  {
    value: "FCFA",
    label: "Amounts you recognise",
    hint: "Central African CFA francs throughout.",
  },
  {
    value: "Yours only",
    label: "Private books",
    hint: "Each signed-in account reads and writes its own data.",
  },
] as const;

export const USE_CASES = [
  {
    src: "/welcome/markets.jpg",
    focus: "center 42%",
    alt: "A tablet showing a financial chart beside a market screen",
    title: "See the month take shape",
    quote: "I wanted the picture of the month, not another spreadsheet.",
    text: "Income, expenses, and what is left — one view of the month you can actually read.",
  },
  {
    src: "/welcome/ledger.jpg",
    focus: "center 40%",
    alt: "A phone calculator held over household papers",
    title: "Keep the everyday numbers",
    quote: "The small sums are what used to slip. Now they stay in the book.",
    text: "Log a payment from your phone. The totals update before you put the papers away.",
  },
] as const;
