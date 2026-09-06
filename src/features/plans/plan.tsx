'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, PiggyBank, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from 'recharts';
import type { Period, FinanceData, Summary } from '@/src/types/finance';
import { peso, periodDays } from '@/src/lib/finance';
import { Activity } from '@/src/features/activity/activity';
import { InfoTip, Metric } from '@/src/components/finance-ui';
import { activitySeries, analyze } from '@/src/features/analytics/calculations';

export const activityChartConfig = {
  expenses: { label: 'Expenses', color: '#e11d48' },
  savings: { label: 'Savings', color: '#059669' },
  investments: { label: 'Investments', color: '#4f46e5' },
  planned: { label: 'Salary-based expense limit', color: '#d97706' },
} satisfies ChartConfig;

export function Plan({
  data,
  summary,
  setData,
}: {
  data: FinanceData;
  summary: Summary;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [period, setPeriod] = useState<Period>('30d');
  const [minSavings, setMinSavings] = useState(
    String(data.plan.minSavingsPercent),
  );
  const [maxSavings, setMaxSavings] = useState(
    String(data.plan.maxSavingsPercent),
  );
  const [maxInvestment, setMaxInvestment] = useState(
    String(data.plan.maxInvestmentPercent),
  );
  const analytics = useMemo(
    () => analyze(data.transactions, periodDays[period]),
    [data.transactions, period],
  );
  const savingsBalance = data.transactions
    .filter((transaction) => transaction.type === 'saving')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const chartSeries = useMemo(
    () => activitySeries(data, period),
    [data, period],
  );
  const chartTitle =
    period === '7d'
      ? 'Last 7 days'
      : period === '30d'
        ? 'Last 30 days'
        : period === '6m'
          ? 'Last 6 months'
          : `${new Date().getFullYear()} yearly activity`;
  function savePlan(e: React.FormEvent) {
    e.preventDefault();
    const min = Math.max(0, Math.min(100, Number(minSavings)));
    const max = Math.max(min, Math.min(100, Number(maxSavings)));
    const investment = Math.max(0, Math.min(100, Number(maxInvestment)));
    setMinSavings(String(min));
    setMaxSavings(String(max));
    setMaxInvestment(String(investment));
    setData((current) => ({
      ...current,
      plan: {
        minSavingsPercent: min,
        maxSavingsPercent: max,
        maxInvestmentPercent: investment,
      },
    }));
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Projection and behavior from your recorded data.
          </p>
          <h1 className="text-3xl font-bold">Activity Summary</h1>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(['7d', '30d', '6m', '1y'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${period === p ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              {p === '6m' ? '6 months' : p === '1y' ? 'Year' : p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Expenses"
          value={peso.format(analytics.expenses)}
          icon={<TrendingDown />}
        />
        <Metric
          label="Saved"
          value={peso.format(analytics.savings)}
          icon={<PiggyBank />}
        />
        <Metric
          label="Invested"
          value={peso.format(analytics.investments)}
          icon={<TrendingUp />}
        />
        <Metric
          label="Savings + investment ratio"
          value={`${Math.round(analytics.ratio * 100)}%`}
          icon={<BarChart3 />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
        <Card>
          <CardHeader>
            <CardTitle>{chartTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Peaks mark periods where expenses reached the salary-based limit
              or exceeded savings and investments combined.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer
              config={activityChartConfig}
              className="h-[300px] w-full aspect-auto"
            >
              <LineChart
                data={chartSeries}
                margin={{ top: 24, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    `₱${Math.round(Number(value) / 1000)}k`
                  }
                  width={42}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_value, payload) =>
                        String(payload?.[0]?.payload?.dateLabel || 'Activity')
                      }
                      formatter={(value, name) => (
                        <div className="flex w-full min-w-40 items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {activityChartConfig[
                              name as keyof typeof activityChartConfig
                            ]?.label || String(name)}
                          </span>
                          <span className="font-mono font-medium">
                            {peso.format(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--color-expenses)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="var(--color-savings)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="investments"
                  stroke="var(--color-investments)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="planned"
                  stroke="var(--color-planned)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                {chartSeries
                  .filter((item) => item.peak)
                  .map((item) => (
                    <ReferenceDot
                      key={item.month}
                      x={item.month}
                      y={item.expenses}
                      r={5}
                      fill="#f59e0b"
                      stroke="#fff"
                      label={{
                        value: item.shortDate
                          ? `Expense peak · ${item.shortDate}`
                          : 'Expense peak',
                        position: 'top',
                        fill: '#b45309',
                        fontSize: 10,
                      }}
                    />
                  ))}
              </LineChart>
            </ChartContainer>
            {analytics.expenseDayCount < 7 ? (
              <div className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Log expenses for at least 7 days to detect spending spikes.
              </div>
            ) : analytics.spike ? (
              <div className="flex gap-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="size-5 shrink-0" />
                <p>{analytics.spike}</p>
              </div>
            ) : (
              <div className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                No unusual expense spike was detected in this period.
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  Salary-based projection{' '}
                  <InfoTip text="Salary minus expense activities logged in the current month." />
                </CardTitle>
                {analytics.expenseDayCount < 7 && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                    Limited data
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly salary</span>
                <b>{peso.format(data.salary)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Expenses logged this month
                </span>
                <b>
                  {peso.format(summary.expenses)} ·{' '}
                  {Math.round(
                    (summary.expenses / Math.max(1, data.salary)) * 100,
                  )}
                  %
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Savings logged this month
                </span>
                <b>
                  {peso.format(summary.savings)} ·{' '}
                  {Math.round(
                    (summary.savings / Math.max(1, data.salary)) * 100,
                  )}
                  %
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Investments logged this month
                </span>
                <b>
                  {peso.format(summary.investments)} ·{' '}
                  {Math.round(
                    (summary.investments / Math.max(1, data.salary)) * 100,
                  )}
                  %
                </b>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Daily expense average
                </span>
                <b>{peso.format(summary.dailyAverage)}</b>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Projected salary-based balance
                </p>
                <p
                  className={`text-3xl font-bold ${summary.projected < 0 ? 'text-amber-600' : ''}`}
                >
                  {peso.format(summary.projected)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Monthly salary minus expense entries logged during the current
                  month. Monthly allocations are excluded.
                </p>
                <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
                  This is an estimate based only on activities you record.
                  Missing, delayed, or unusual expenses can change the result
                  {analytics.expenseDayCount < 7
                    ? '; seven distinct logging days are recommended'
                    : ''}
                  .
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Emergency fund</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex justify-between">
                <b>{peso.format(savingsBalance)}</b>
                <span className="text-xs text-muted-foreground">
                  of {peso.format(data.emergencyTarget)}
                </span>
              </div>
              <Progress
                value={Math.min(
                  100,
                  (savingsBalance / Math.max(1, data.emergencyTarget)) * 100,
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recommended plan limits</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customize your monthly savings range and investment cap.
          </p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={savePlan}
            className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <label className="text-sm font-semibold">
              Minimum savings %
              <Input
                className="mt-1"
                type="number"
                min="0"
                max="100"
                value={minSavings}
                onChange={(e) => setMinSavings(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold">
              Maximum savings %
              <Input
                className="mt-1"
                type="number"
                min="0"
                max="100"
                value={maxSavings}
                onChange={(e) => setMaxSavings(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold">
              Maximum investment %
              <Input
                className="mt-1"
                type="number"
                min="0"
                max="100"
                value={maxInvestment}
                onChange={(e) => setMaxInvestment(e.target.value)}
              />
            </label>
            <Button className="self-end" type="submit">
              Save plan
            </Button>
          </form>
          <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <p>
              Minimum savings:{' '}
              <b className="text-foreground">
                {peso.format((data.salary * data.plan.minSavingsPercent) / 100)}
              </b>
            </p>
            <p>
              Maximum savings:{' '}
              <b className="text-foreground">
                {peso.format((data.salary * data.plan.maxSavingsPercent) / 100)}
              </b>
            </p>
            <p>
              Investment cap:{' '}
              <b className="text-foreground">
                {peso.format(
                  (data.salary * data.plan.maxInvestmentPercent) / 100,
                )}
              </b>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="flex gap-3">
          <ShieldCheck className="size-5 shrink-0 text-indigo-600" />
          <p className="text-sm leading-6 text-muted-foreground">
            <b className="text-foreground">Manual investment values only.</b>{' '}
            Investment amounts shown here use your initial entries and manual
            adjustments. Actual value may differ from DragonFi, GStocks, GFunds,
            Binance, MEXC, or another platform because market fluctuations are
            not integrated yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
