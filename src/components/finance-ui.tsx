'use client';

import { ArrowDownLeft, ArrowUpRight, CircleHelp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { EntryType, Transaction } from '@/src/types/finance';
import { peso } from '@/src/lib/finance';

export function InfoTip({
  text,
  children,
}: {
  text: string;
  children?: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          children || (
            <button
              type="button"
              className="inline-grid size-5 place-items-center rounded-full opacity-75 hover:opacity-100"
              aria-label={text}
            >
              <CircleHelp className="size-3.5" />
            </button>
          )
        }
      />
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function EntryIcon({ type }: { type: EntryType }) {
  const positive = ['income', 'withdrawal'].includes(type);
  return (
    <span
      className={`grid size-10 place-items-center rounded-xl ${positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}
    >
      {positive ? <ArrowDownLeft /> : <ArrowUpRight />}
    </span>
  );
}

export function TransactionRow({ item }: { item: Transaction }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <EntryIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.accountLabel}
        </p>
      </div>
      <b
        className={
          ['income', 'withdrawal'].includes(item.type) ? 'text-emerald-600' : ''
        }
      >
        {['income', 'withdrawal'].includes(item.type) ? '+' : '−'}
        {peso.format(item.amount)}
      </b>
    </div>
  );
}
