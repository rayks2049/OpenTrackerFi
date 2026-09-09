

export type View = 'home' | 'activity' | 'plan' | 'accounts';

export type ParentCategory =
  | 'Food'
  | 'Transport'
  | 'Bills'
  | 'Shopping'
  | 'Health'
  | 'Savings'
  | 'Investments'
  | 'Other';

export type EntryType =
  | 'expense'
  | 'income'
  | 'saving'
  | 'investment'
  | 'withdrawal'
  | 'value_adjustment';

export type Period = '7d' | '30d' | '6m' | '1y';

export type Subcategory = {
  id: string;
  parent: ParentCategory;
  name: string;
  plannedAmount: number;
  archived: boolean;
};

export type Account = {
  id: string;
  provider: string;
  nickname: string;
  type: string;
  balance: number;
  archived: boolean;
};

export type Transaction = {
  id: string;
  type: EntryType;
  amount: number;
  parent: ParentCategory | 'Income';
  subcategoryId?: string;
  label: string;
  accountId?: string;
  accountLabel: string;
  date: string;
  note?: string;
};

export type Adjustment = {
  id: string;
  accountId: string;
  amount: number;
  reason: string;
  date: string;
};

export type PlanPreferences = {
  minSavingsPercent: number;
  maxSavingsPercent: number;
  maxInvestmentPercent: number;
};

export type FinanceData = {
  version: 4;
  salary: number;
  nextPayday: string;
  emergencyTarget: number;
  emergencyAccountIds?: string[];
  plan: PlanPreferences;
  accounts: Account[];
  subcategories: Subcategory[];
  transactions: Transaction[];
  adjustments: Adjustment[];
};

export type Summary = {
  emergencyBalance: number;
  availableBalance: number;
  expenseBudget: number;
  budgetStatus: 'unset' | 'within' | 'approaching' | 'over';
  budgetExcess: number;
  salaryShortfall: number;
  liquid: number;
  expenses: number;
  savings: number;
  investments: number;
  reserved: number;
  dailyAverage: number;
  estimatedRemaining: number;
  remainingTarget: number;
  days: number;
  projected: number;
  safe: number;
  ratio: number;
};
