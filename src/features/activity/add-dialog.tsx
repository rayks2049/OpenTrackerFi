'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ParentCategory, EntryType, Account, Transaction, FinanceData } from '@/src/types/finance';
import { parents, accountName } from '@/src/lib/finance';

export function AddDialog({
  open,
  setOpen,
  data,
  onAdd,
  onNeedAccount,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  data: FinanceData;
  onAdd: (entry: Omit<Transaction, 'id' | 'date' | 'accountLabel'>) => void;
  onNeedAccount: () => void;
}) {
  const activeAccounts = data.accounts.filter((a) => !a.archived);
  const [amount, setAmount] = useState(''),
    [parent, setParent] = useState<ParentCategory>('Food'),
    [accountId, setAccountId] = useState('');
  useEffect(() => {
    if (open) {
      setParent('Food');
      setAccountId(activeAccounts[0]?.id || '');
    }
  }, [open]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number(amount) || !accountId) return;
    const type: EntryType =
      parent === 'Savings'
        ? 'saving'
        : parent === 'Investments'
          ? 'investment'
          : 'expense';
    onAdd({
      type,
      amount: Number(amount),
      parent,
      subcategoryId: undefined,
      label: parent,
      accountId,
      note: '',
    });
    setAmount('');
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
          <DialogDescription>
            Enter an amount, choose a category, then select the account. Savings
            and investments are classified automatically.
          </DialogDescription>
        </DialogHeader>
        {!activeAccounts.length ? (
          <div className="space-y-3 rounded-xl bg-amber-500/10 p-4 text-sm">
            <p>Add or restore an account before recording an activity.</p>
            <Button type="button" onClick={onNeedAccount}>
              Add an account
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold">
              1. Amount
              <Input
                className="mt-1 h-11"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm font-semibold">
              2. Category
              <select
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3"
                value={parent}
                onChange={(e) => setParent(e.target.value as ParentCategory)}
              >
                {parents.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <div
              className={`rounded-xl p-3 text-sm ${parent === 'Savings' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : parent === 'Investments' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}
            >
              Classified as{' '}
              <b>
                {parent === 'Savings'
                  ? 'Saving'
                  : parent === 'Investments'
                    ? 'Investment'
                    : 'Expense'}
              </b>
            </div>
            <label className="block text-sm font-semibold">
              3. Account
              <select
                className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {accountName(a)}
                  </option>
                ))}
              </select>
            </label>
            {parent === 'Investments' && (
              <p className="rounded-xl bg-indigo-500/10 p-3 text-xs text-indigo-700 dark:text-indigo-300">
                This records your contribution at its entered value. Actual
                platform value may change with the market.
              </p>
            )}
            <Button className="w-full" type="submit">
              Save entry
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
