import type { FinanceData, Summary } from '@/src/types/finance';
import { daysUntil } from '@/src/lib/finance';

const money = (value: number) => Math.round(value * 100) / 100;

export function accountTotals(data: FinanceData) {
  const accounts = data.accounts.filter((account) => !account.archived);
  const selected = new Set(data.emergencyAccountIds || []);
  const liquid = money(accounts.reduce((sum, account) => sum + account.balance, 0));
  // An overdrawn account holds no reserve, but its debt still reduces the total.
  const emergencyBalance = money(accounts.reduce((sum, account) =>
    sum + (selected.has(account.id) ? Math.max(0, account.balance) : 0), 0));
  return { liquid, emergencyBalance, availableBalance: money(liquid - emergencyBalance) };
}

export function expenseBudget(data: FinanceData) {
  return money(data.subcategories
    .filter((item) => !item.archived && !['Savings', 'Investments'].includes(item.parent))
    .reduce((sum, item) => sum + Math.max(0, item.plannedAmount), 0));
}

export function summarizeFinance(data: FinanceData, now = new Date()): Summary {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthly = data.transactions.filter((item) => {
    const date = new Date(item.date);
    return date >= start && date < end && date <= now;
  });
  const total = (type: string) => money(monthly.filter((item) => item.type === type)
    .reduce((sum, item) => sum + item.amount, 0));
  const expenses = total('expense'), savings = total('saving'), investments = total('investment');
  const totals = accountTotals(data);
  const budget = expenseBudget(data);
  const budgetStatus = budget <= 0 ? 'unset' : expenses > budget ? 'over' : expenses >= budget * 0.8 ? 'approaching' : 'within';
  const projected = money(data.salary - expenses);
  const days = daysUntil(data.nextPayday);
  return {
    ...totals, expenses, savings, investments, projected, days,
    expenseBudget: budget, budgetStatus,
    budgetExcess: money(Math.max(0, expenses - budget)),
    salaryShortfall: money(Math.max(0, -projected)),
    reserved: totals.emergencyBalance,
    dailyAverage: expenses / Math.max(1, now.getDate()),
    estimatedRemaining: expenses, remainingTarget: 0,
    safe: Math.max(0, totals.availableBalance / days),
    ratio: expenses ? (savings + investments) / expenses : 0,
  };
}

export function deleteAccount(data: FinanceData, id: string): FinanceData {
  return {
    ...data,
    accounts: data.accounts.filter((account) => account.id !== id),
    emergencyAccountIds: (data.emergencyAccountIds || []).filter((accountId) => accountId !== id),
    // Keep transaction and correction records unchanged, including their account IDs.
  };
}
