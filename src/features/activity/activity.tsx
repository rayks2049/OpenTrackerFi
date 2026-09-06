'use client';

import { useState } from 'react';
import { Filter, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { FinanceData } from '@/src/types/finance';
import { peso, isOutflow, isCashflow } from '@/src/lib/finance';
import { EntryIcon } from '@/src/components/finance-ui';

export function Activity({
  data,
  setData,
  onLogExpense,
}: {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  onLogExpense: () => void;
}) {
  type ActivityFilter =
    | 'all'
    | 'expense'
    | 'saving'
    | 'investment'
    | 'correction';
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const transactionItems = data.transactions
    .filter((transaction) => filter === 'all' || transaction.type === filter)
    .map((transaction) => ({
      kind: 'transaction' as const,
      date: transaction.date,
      transaction,
    }));
  const correctionItems =
    filter === 'all' || filter === 'correction'
      ? data.adjustments.map((adjustment) => ({
          kind: 'correction' as const,
          date: adjustment.date,
          adjustment,
        }))
      : [];
  const items = [...transactionItems, ...correctionItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  function remove(id: string) {
    setData((current) => {
      const removed = current.transactions.find((t) => t.id === id);
      return {
        ...current,
        accounts:
          removed?.accountId && isCashflow(removed.type)
            ? current.accounts.map((a) =>
                a.id === removed.accountId
                  ? {
                      ...a,
                      balance:
                        a.balance +
                        (isOutflow(removed.type)
                          ? removed.amount
                          : -removed.amount),
                    }
                  : a,
              )
            : current.accounts,
        transactions: current.transactions.filter((t) => t.id !== id),
      };
    });
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Every peso, accounted for.
          </p>
          <h1 className="text-3xl font-bold">Activity</h1>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Filter activity"
                  title="Filter activity"
                  className="relative"
                />
              }
            >
              <Filter />
              {filter !== 'all' && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuLabel>Show activity</DropdownMenuLabel>
              {(
                [
                  'all',
                  'expense',
                  'saving',
                  'investment',
                  'correction',
                ] as ActivityFilter[]
              ).map((value) => (
                <DropdownMenuItem key={value} onClick={() => setFilter(value)}>
                  <span
                    className={`size-2 rounded-full ${filter === value ? 'bg-primary' : 'bg-muted'}`}
                  />
                  <span className="capitalize">
                    {value === 'all' ? 'All activity' : value}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onLogExpense}>
            <Plus /> Log activity
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {items.map((item) =>
            item.kind === 'transaction' ? (
              <div
                key={item.transaction.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <EntryIcon type={item.transaction.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {item.transaction.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.transaction.parent} · {item.transaction.accountLabel}{' '}
                    ·{' '}
                    {new Date(item.transaction.date).toLocaleDateString(
                      'en-PH',
                    )}
                  </p>
                </div>
                <p
                  className={`font-bold ${['income', 'withdrawal'].includes(item.transaction.type) ? 'text-emerald-600' : ''}`}
                >
                  {['income', 'withdrawal'].includes(item.transaction.type)
                    ? '+'
                    : '−'}
                  {peso.format(item.transaction.amount)}
                </p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item.transaction.id)}
                  aria-label="Delete activity"
                >
                  <Trash2 />
                </Button>
              </div>
            ) : (
              <div
                key={item.adjustment.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                  <Pencil className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">Balance correction</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.adjustment.reason} ·{' '}
                    {new Date(item.adjustment.date).toLocaleDateString('en-PH')}
                  </p>
                </div>
                <p className="font-bold text-amber-600">
                  {item.adjustment.amount >= 0 ? '+' : '−'}
                  {peso.format(Math.abs(item.adjustment.amount))}
                </p>
              </div>
            ),
          )}
          {!items.length && (
            <p className="p-8 text-center text-muted-foreground">
              No entries here yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
