export type CategoryType = "income" | "expense";

export type Plan = "free" | "premium";

export type Profile = {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  plan: Plan;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
};

export type TransactionOrigin = "client" | "admin" | "reversal";

export type Transaction = {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  origin: TransactionOrigin;
  reversesId: string | null;
};

export type SavingsGoal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
};

export type FinanceSnapshot = {
  profile: Profile;
  categories: Category[];
  transactions: Transaction[];
  goals: SavingsGoal[];
};
