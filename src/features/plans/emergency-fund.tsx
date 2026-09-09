import { useId, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { FinanceData, Summary } from '@/src/types/finance';
import { accountName, peso } from '@/src/lib/finance';

export function EmergencyFund({ data, summary, setData }: {
  data: FinanceData; summary: Summary; setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const targetId = useId();
  const [targetDraft, setTarget] = useState<string | null>(null);
  const [selectedDraft, setSelected] = useState<string[] | null>(null);
  const target = targetDraft ?? String(data.emergencyTarget);
  const selected = selectedDraft ?? data.emergencyAccountIds ?? [];
  const [saved, setSaved] = useState(false);
  const accounts = data.accounts.filter((account) => !account.archived);
  return <Card className="self-start">
    <CardHeader><CardTitle>Emergency fund</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <p className="text-2xl font-bold">{peso.format(summary.emergencyBalance)} <span className="text-sm font-normal text-muted-foreground">of {peso.format(data.emergencyTarget)}</span></p>
      <Progress value={data.emergencyTarget > 0 ? Math.min(100, summary.emergencyBalance / data.emergencyTarget * 100) : 0} />
      <p className="text-xs leading-5 text-muted-foreground">Reserve the full positive balance of selected accounts. This money is already included in overall balance, and is excluded from available balance. The target itself does not move money.</p>
      {!(data.emergencyAccountIds || []).length && <p className="text-sm text-muted-foreground">Choose the accounts holding your emergency money. Savings contributions are not automatically counted here.</p>}
      <form className="space-y-3" onSubmit={(event) => {
        event.preventDefault();
        const amount = Number(target);
        if (!Number.isFinite(amount) || amount < 0) return;
        setData((current) => ({ ...current, emergencyTarget: Math.round(amount * 100) / 100,
          emergencyAccountIds: current.accounts.filter((account) => !account.archived && selected.includes(account.id)).map((account) => account.id) }));
        setSaved(true);
        setTarget(null);
        setSelected(null);
      }}>
        <label htmlFor={targetId} className="block text-sm font-semibold">Emergency fund target
          <Input id={targetId} type="number" min="0" step="0.01" required value={target} onChange={(event) => { setTarget(event.target.value); setSaved(false); }} />
        </label>
        <fieldset className="space-y-2"><legend className="mb-2 text-sm font-semibold">Accounts holding the reserve</legend>
          {accounts.map((account) => <label key={account.id} className="flex items-start gap-2 rounded-lg border p-2 text-sm">
            <input type="checkbox" className="mt-1" checked={selected.includes(account.id)} onChange={(event) => {
              setSelected(event.target.checked ? [...selected, account.id] : selected.filter((id) => id !== account.id)); setSaved(false);
            }} />
            <span>{accountName(account)}<span className="block text-xs text-muted-foreground">{peso.format(account.balance)}</span></span>
          </label>)}
          {!accounts.length && <p className="text-sm text-muted-foreground">Add an account on the Accounts page first.</p>}
        </fieldset>
        <Button type="submit" className="w-full">Save emergency fund</Button>
        {saved && <p aria-live="polite" className="text-sm text-primary">Emergency fund saved.</p>}
      </form>
    </CardContent>
  </Card>;
}
