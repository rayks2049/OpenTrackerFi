'use client';

import { useState } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ParentCategory, Subcategory, FinanceData } from '@/src/types/finance';
import { peso, uid } from '@/src/lib/finance';

export function BreakdownDialog({
  parent,
  setParent,
  data,
  setData,
}: {
  parent: ParentCategory | null;
  setParent: (p: ParentCategory | null) => void;
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [name, setName] = useState(''),
    [planned, setPlanned] = useState('0'),
    [showArchived, setShowArchived] = useState(false);
  if (!parent) return null;
  const activeParent = parent;
  const subs = data.subcategories.filter(
    (s) => s.parent === activeParent && (showArchived || !s.archived),
  );
  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setData((c) => ({
      ...c,
      subcategories: [
        ...c.subcategories,
        {
          id: uid(),
          parent: activeParent,
          name: name.trim(),
          plannedAmount: Number(planned),
          archived: false,
        },
      ],
    }));
    setName('');
    setPlanned('0');
  }
  function update(id: string, amount: number) {
    setData((c) => ({
      ...c,
      subcategories: c.subcategories.map((s) =>
        s.id === id ? { ...s, plannedAmount: amount } : s,
      ),
    }));
  }
  function archive(sub: Subcategory) {
    setData((c) => ({
      ...c,
      subcategories: c.subcategories.map((s) =>
        s.id === sub.id ? { ...s, archived: !s.archived } : s,
      ),
    }));
  }
  return (
    <Dialog open={!!parent} onOpenChange={(v) => !v && setParent(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{parent} breakdown</DialogTitle>
          <DialogDescription>
            Allocate monthly amounts across subcategories. These are tracking
            labels, not bills or payment schedules. Parent categories stay
            fixed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={add} className="grid grid-cols-[1fr_7rem_auto] gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              parent === 'Bills' ? 'Loan, tuition, water…' : 'New subcategory'
            }
            required
          />
          <Input
            type="number"
            min="0"
            value={planned}
            onChange={(e) => setPlanned(e.target.value)}
            aria-label="Planned amount"
          />
          <Button type="submit">Add</Button>
        </form>
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {subs.map((sub) => {
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            const entryType =
              sub.parent === 'Savings'
                ? 'saving'
                : sub.parent === 'Investments'
                  ? 'investment'
                  : 'expense';
            const actual = data.transactions
              .filter(
                (t) =>
                  t.type === entryType &&
                  t.subcategoryId === sub.id &&
                  new Date(t.date) >= monthStart,
              )
              .reduce((s, t) => s + t.amount, 0);
            return (
              <div
                key={sub.id}
                className={`rounded-xl border p-3 ${sub.archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{sub.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tracked this month {peso.format(actual)}
                    </p>
                  </div>
                  <label className="w-28 text-xs text-muted-foreground">
                    Allocation
                    <Input
                      className="mt-1"
                      type="number"
                      min="0"
                      value={sub.plannedAmount}
                      onChange={(e) => update(sub.id, Number(e.target.value))}
                      disabled={sub.archived}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => archive(sub)}
                  >
                    {sub.archived ? <ShieldCheck /> : <Trash2 />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-xs font-bold text-primary"
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </button>
          <p className="text-xs text-muted-foreground">
            Allocation total:{' '}
            {peso.format(
              subs
                .filter((s) => !s.archived)
                .reduce((sum, s) => sum + s.plannedAmount, 0),
            )}
          </p>
        </div>
        <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
          Archived allocations are removed from current tracking and new
          entries. Their previous transactions remain in overall analytics.
        </p>
        <Button className="w-full" onClick={() => setParent(null)}>
          Save changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
