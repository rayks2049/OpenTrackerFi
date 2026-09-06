'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Account, FinanceData } from '@/src/types/finance';
import { peso, uid, accountName } from '@/src/lib/finance';

export function Accounts({
  data,
  setData,
}: {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [editing, setEditing] = useState<Account | null>(null),
    [adding, setAdding] = useState(false),
    [showArchived, setShowArchived] = useState(false);
  const visible = data.accounts.filter((a) => showArchived || !a.archived);
  function archive(account: Account) {
    if (
      !confirm(
        `Remove ${accountName(account)} from current summaries? Its historical transactions will remain in analytics.`,
      )
    )
      return;
    setData((c) => ({
      ...c,
      accounts: c.accounts.map((a) =>
        a.id === account.id ? { ...a, archived: true } : a,
      ),
    }));
  }
  function restore(account: Account) {
    setData((c) => ({
      ...c,
      accounts: c.accounts.map((a) =>
        a.id === account.id ? { ...a, archived: false } : a,
      ),
    }));
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Use nicknames when you have multiple accounts from one provider.
          </p>
          <h1 className="text-3xl font-bold">Accounts</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Hide removed' : 'Show removed'}
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus /> Add account
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((account) => (
          <Card
            key={account.id}
            className={account.archived ? 'opacity-60' : ''}
          >
            <CardContent className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CreditCard />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{account.provider}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.nickname || 'Account'}
                  {account.archived ? ' · Removed from summaries' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">
                  {peso.format(account.balance)}
                </p>
                <div className="mt-1 flex justify-end gap-1">
                  {account.archived ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => restore(account)}
                    >
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setEditing(account)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => archive(account)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!visible.length && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No active accounts. Add one to continue recording entries.
          </CardContent>
        </Card>
      )}
      <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
        Removed accounts no longer contribute their current balance to dashboard
        summaries or projections. Income, expenses, savings, and investments
        previously recorded from them remain in your historical analytics.
      </p>
      <AccountDialog
        open={adding || !!editing}
        setOpen={(v) => {
          if (!v) {
            setAdding(false);
            setEditing(null);
          }
        }}
        account={editing}
        data={data}
        setData={setData}
      />
    </div>
  );
}

export function AccountDialog({
  open,
  setOpen,
  account,
  data,
  setData,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  account: Account | null;
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [provider, setProvider] = useState('GCash'),
    [nickname, setNickname] = useState(''),
    [balance, setBalance] = useState('0'),
    [reason, setReason] = useState('');
  useEffect(() => {
    if (open) {
      setProvider(account?.provider || 'GCash');
      setNickname(account?.nickname || '');
      setBalance(String(account?.balance || 0));
      setReason('');
    }
  }, [open, account]);
  function save(e: React.FormEvent) {
    e.preventDefault();
    const nextBalance = Number(balance);
    if (account) {
      const delta = nextBalance - account.balance;
      if (delta !== 0 && !reason.trim()) return;
      setData((c) => ({
        ...c,
        accounts: c.accounts.map((a) =>
          a.id === account.id
            ? {
                ...a,
                provider,
                nickname,
                type: 'Account',
                balance: nextBalance,
              }
            : a,
        ),
        adjustments:
          delta === 0
            ? c.adjustments
            : [
                {
                  id: uid(),
                  accountId: account.id,
                  amount: delta,
                  reason: reason.trim(),
                  date: new Date().toISOString(),
                },
                ...c.adjustments,
              ],
      }));
    } else {
      setData((c) => ({
        ...c,
        accounts: [
          ...c.accounts,
          {
            id: uid(),
            provider,
            nickname,
            type: 'Account',
            balance: nextBalance,
            archived: false,
          },
        ],
        adjustments: [...c.adjustments],
      }));
    }
    setOpen(false);
  }
  const changed = !!account && Number(balance) !== account.balance;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Edit account' : 'Add account'}</DialogTitle>
          <DialogDescription>
            Account changes are stored only on this device.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">
            Provider
            <Input
              className="mt-1"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="GCash, Maya, MariBank…"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Nickname
            <Input
              className="mt-1"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Main wallet, Bills, Emergency fund…"
            />
          </label>
          <label className="block text-sm font-semibold">
            Current balance
            <Input
              className="mt-1"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </label>
          {changed && (
            <label className="block text-sm font-semibold">
              Reason for correction
              <Input
                className="mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why does this balance need correcting?"
                required
              />
            </label>
          )}
          <Button className="w-full" type="submit">
            Save account
          </Button>
        </form>
        {account &&
          data.adjustments.filter((a) => a.accountId === account.id).length >
            0 && (
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent adjustments
              </p>
              {data.adjustments
                .filter((a) => a.accountId === account.id)
                .slice(0, 3)
                .map((a) => (
                  <p key={a.id} className="text-xs text-muted-foreground">
                    {a.amount >= 0 ? '+' : ''}
                    {peso.format(a.amount)} · {a.reason}
                  </p>
                ))}
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
