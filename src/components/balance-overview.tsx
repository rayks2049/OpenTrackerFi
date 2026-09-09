import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { FinanceData, Summary } from '@/src/types/finance';
import { peso } from '@/src/lib/finance';

export function BalanceOverview({ data, summary, className }: {
  data: FinanceData; summary: Summary; className?: string;
}) {
  const warning = summary.budgetStatus === 'over' || summary.budgetStatus === 'approaching';
  return <Card className={className}>
    <CardHeader>
      <CardTitle>Overall account balance</CardTitle>
      <p className="text-4xl font-bold text-primary">{peso.format(summary.liquid)}</p>
      <p className="text-xs text-muted-foreground">Current balances of remaining accounts. Logged expenses are already deducted.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Emergency reserve included</dt><dd className="text-xl font-bold">{peso.format(summary.emergencyBalance)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Available after emergency reserve</dt><dd className={`text-xl font-bold ${summary.availableBalance < 0 ? 'text-destructive' : ''}`}>{peso.format(summary.availableBalance)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Monthly salary</dt><dd className="font-bold">{peso.format(data.salary)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Expenses this month</dt><dd className="font-bold">{peso.format(summary.expenses)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{summary.projected < 0 ? 'Monthly salary shortfall' : 'Monthly salary remaining'}</dt><dd className={`font-bold ${summary.projected < 0 ? 'text-destructive' : ''}`}>{peso.format(Math.abs(summary.projected))}</dd></div>
      </dl>
      <p className="text-xs leading-5 text-muted-foreground">Salary remaining compares this month’s salary with recorded expenses. It is not an additional account balance or a forecast. Setting a salary does not deposit money.</p>
      <div aria-live="polite" className={`space-y-2 rounded-xl border p-3 ${warning ? 'border-amber-500/40 bg-amber-500/10' : 'bg-muted/50'}`}>
        <p className="font-semibold">{summary.budgetStatus === 'unset' ? 'Set a spending plan' : summary.budgetStatus === 'over' ? 'Over plan' : summary.budgetStatus === 'approaching' ? 'Approaching plan' : 'Within plan'}</p>
        {summary.expenseBudget > 0 ? <>
          <p className="text-sm">{peso.format(summary.expenses)} of {peso.format(summary.expenseBudget)} monthly expense budget used ({Math.round(summary.expenses / summary.expenseBudget * 100)}%).</p>
          <Progress value={Math.min(100, summary.expenses / summary.expenseBudget * 100)} />
          {summary.budgetStatus === 'over' && <p className="text-sm font-semibold">Expenses exceed your plan by {peso.format(summary.budgetExcess)}.</p>}
        </> : <p className="text-sm">Set expense amounts in Dashboard → Monthly allocations. Savings and investment allocations are excluded.</p>}
      </div>
      {summary.salaryShortfall > 0 && <p aria-live="polite" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold">Expenses exceed monthly salary by {peso.format(summary.salaryShortfall)}. These expenses are already reflected in account balances; the shortfall is not deducted again.</p>}
    </CardContent>
  </Card>;
}
