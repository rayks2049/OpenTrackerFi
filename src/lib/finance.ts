import type { ParentCategory, EntryType, Period, Account, FinanceData } from '@/src/types/finance';

export const parents: ParentCategory[] = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Health',
  'Savings',
  'Investments',
  'Other',
];

export const parentColors: Record<ParentCategory, string> = {
  Food: 'bg-emerald-500',
  Transport: 'bg-blue-500',
  Bills: 'bg-amber-500',
  Shopping: 'bg-violet-500',
  Health: 'bg-rose-500',
  Savings: 'bg-cyan-500',
  Investments: 'bg-indigo-500',
  Other: 'bg-zinc-500',
};

export const seedData: FinanceData = {
  version: 4,
  salary: 0,
  nextPayday: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15)
    .toISOString()
    .slice(0, 10),
  emergencyTarget: 0,
  emergencyAccountIds: [],
  plan: {
    minSavingsPercent: 0,
    maxSavingsPercent: 0,
    maxInvestmentPercent: 0,
  },
  accounts: [],
  subcategories: [],
  transactions: [],
  adjustments: [],
};

export const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
});

export const periodDays: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '6m': 183,
  '1y': 365,
};

export const uid = () => crypto.randomUUID();

export const accountName = (account: Account) =>
  `${account.provider}${account.nickname ? ` · ${account.nickname}` : ''}`;

export const isOutflow = (type: EntryType) =>
  ['expense', 'saving', 'investment'].includes(type);

export const isCashflow = (type: EntryType) => type !== 'value_adjustment';

export const dateWithin = (date: string, days: number) =>
  new Date(date).getTime() >= Date.now() - days * 86400000;

export const daysUntil = (date: string) =>
  Math.max(
    1,
    Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000),
  );
