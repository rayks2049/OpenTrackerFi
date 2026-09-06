'use client';

import { AlertTriangle, BarChart3, ChevronRight, Eye, Sparkles, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { View, ParentCategory, FinanceData, Summary } from '@/src/types/finance';
import { parents, parentColors, peso } from '@/src/lib/finance';
import { Plan } from '@/src/features/plans/plan';
import { InfoTip, TransactionRow } from '@/src/components/finance-ui';
import { getSpike, getLoggingStreak } from '@/src/features/analytics/calculations';

export function Dashboard({
  data,
  summary,
  setView,
  onBreakdown,
  onOpenSettings,
}: {
  data: FinanceData;
  summary: Summary;
  setView: (v: View) => void;
  onBreakdown: (p: ParentCategory) => void;
  onOpenSettings: () => void;
}) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const activeSubcategoryIds = new Set(
    data.subcategories.filter((s) => !s.archived).map((s) => s.id),
  );
  const activeMonthlyExpenses = data.transactions.filter(
    (t) =>
      t.type === 'expense' &&
      new Date(t.date) >= monthStart &&
      (!t.subcategoryId || activeSubcategoryIds.has(t.subcategoryId)),
  );
  const grouped = parents
    .map((parent) => ({
      parent,
      amount: data.subcategories
        .filter((s) => !s.archived && s.parent === parent)
        .reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const totalMonthlyAllocations = grouped.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const monthlyPercent = Math.min(
    100,
    data.salary > 0 ? (totalMonthlyAllocations / data.salary) * 100 : 0,
  );
  const spike = getSpike(
    activeMonthlyExpenses,
    Math.max(1, new Date().getDate()),
  );
  const expenseDayCount = new Set(
    activeMonthlyExpenses.map((item) => item.date.slice(0, 10)),
  ).size;
  const activeAccounts = data.accounts.filter((account) => !account.archived);
  const setupSteps = [
    { label: 'Set salary', done: data.salary > 0, action: onOpenSettings },
    {
      label: 'Plan allocations',
      done: totalMonthlyAllocations > 0,
      action: () => onBreakdown('Food'),
    },
    {
      label: 'Add an account',
      done: activeAccounts.length > 0,
      action: () => setView('accounts'),
    },
    {
      label: 'Log your first day',
      done: expenseDayCount > 0,
      action: () => setView('activity'),
    },
  ];
  const setupDone = setupSteps.filter((step) => step.done).length;
  const loggingStreak = getLoggingStreak(data.transactions);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Your plan. Your pace. Every peso on track.
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Stay ahead of payday.
          </h1>
        </div>
        <span className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
          {summary.days} days until payday
        </span>
      </div>
      {setupDone < setupSteps.length && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="grid gap-5 py-5 md:grid-cols-[.7fr_1.3fr] md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-primary">
                <Sparkles className="size-5" />
                <span className="text-xs font-bold uppercase tracking-[.14em]">
                  Fresh start
                </span>
              </div>
              <h2 className="text-2xl font-bold">Build your money trail</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Complete the essentials, then log seven days to unlock a
                stronger projection.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Progress
                  value={(setupDone / setupSteps.length) * 100}
                  className="flex-1"
                />
                <b className="text-sm">
                  {setupDone}/{setupSteps.length}
                </b>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {setupSteps.map((step, index) => (
                <button
                  key={step.label}
                  onClick={step.action}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${step.done ? 'border-emerald-500/20 bg-emerald-500/10' : 'bg-card hover:border-primary/40'}`}
                >
                  <span
                    className={`grid size-8 place-items-center rounded-full text-sm font-bold ${step.done ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
                  >
                    {step.done ? '✓' : index + 1}
                  </span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground md:col-span-2">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/7" />
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[.15em] opacity-70">
              Active account balance
            </p>
            <CardTitle className="text-4xl font-bold md:text-5xl">
              {peso.format(summary.liquid)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between gap-4">
            <div>
              <p className="flex items-center gap-1 text-sm opacity-70">
                Safe today{' '}
                <InfoTip text="Estimated salary-based balance divided by days until payday." />
              </p>
              <p className="text-xl font-bold">{peso.format(summary.safe)}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-sm opacity-70">
                Salary minus expenses{' '}
                <InfoTip text="Monthly salary minus expense entries logged this month. Allocations are not deducted." />
              </p>
              <p
                className={`text-xl font-bold ${summary.projected < 0 ? 'text-amber-200' : ''}`}
              >
                {peso.format(summary.projected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> Plan pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Logged expenses vs saved/invested
              </p>
              <p className="text-2xl font-bold">
                {Math.round(summary.ratio * 100)}%
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/70 p-3">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Trophy className="size-4 text-amber-500" /> {loggingStreak} day
                streak
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.min(7, expenseDayCount)}/7 days
              </span>
            </div>
            {expenseDayCount < 7 ? (
              <p className="text-xs text-muted-foreground">
                Limited data · {Math.min(7, expenseDayCount)}/7 distinct days
                logged.
              </p>
            ) : spike ? (
              <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0" />
                {spike}
              </p>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Spending looks steady this month.
              </p>
            )}
            <button
              onClick={() => setView('plan')}
              className="flex items-center text-xs font-bold text-primary"
            >
              Full analytics <ChevronRight className="size-4" />
            </button>
            <p className="border-t pt-3 text-xs leading-5 text-muted-foreground">
              Estimates use only the expenses you record. Missing or unusual
              entries can change the result.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly allocations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Plan monthly amounts by category and customize each breakdown.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold">
                  {peso.format(totalMonthlyAllocations)} allocated
                </span>
                <span className="text-muted-foreground">
                  {Math.round(monthlyPercent)}% of {peso.format(data.salary)}
                </span>
              </div>
              <Progress value={monthlyPercent} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {grouped.map((item) => (
                <button
                  key={item.parent}
                  onClick={() => onBreakdown(item.parent)}
                  className="flex items-center gap-3 rounded-xl bg-muted/70 p-3 text-left transition hover:bg-muted"
                >
                  <span
                    className={`size-2.5 rounded-full ${parentColors[item.parent]}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted-foreground">
                      {item.parent}
                    </span>
                    <span className="block text-lg font-bold">
                      {peso.format(item.amount)}
                    </span>
                  </span>
                  <Eye className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Recent activity</CardTitle>
              <button
                onClick={() => setView('activity')}
                className="text-xs font-bold text-primary"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {data.transactions.slice(0, 4).map((t) => (
              <TransactionRow key={t.id} item={t} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
