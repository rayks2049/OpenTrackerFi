'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileUp, Printer, RotateCcw, Settings, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Period, Account, FinanceData, Summary } from '@/src/types/finance';
import { peso, periodDays } from '@/src/lib/finance';
import { migrate } from '@/src/services/local-storage';
import { Activity } from '@/src/features/activity/activity';
import { analyze } from '@/src/features/analytics/calculations';
import { encryptBackup, decryptBackup } from '@/src/services/backup';

export function SettingsDialog({
  open,
  setOpen,
  data,
  summary,
  setData,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  data: FinanceData;
  summary: Summary;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [salary, setSalary] = useState(''),
    [payday, setPayday] = useState(''),
    [target, setTarget] = useState(''),
    [password, setPassword] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setSalary(String(data.salary));
      setPayday(data.nextPayday);
      setTarget(String(data.emergencyTarget));
    }
  }, [open, data]);
  function save(e: React.FormEvent) {
    e.preventDefault();
    setData((c) => ({
      ...c,
      salary: Number(salary),
      nextPayday: payday,
      emergencyTarget: Number(target),
    }));
    setOpen(false);
  }
  function download(content: string, name: string, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportCsv() {
    const escapeCsv = (value: unknown) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows: unknown[][] = [
      [
        'Record type',
        'Date / period',
        'Activity type',
        'Category',
        'Description',
        'Account',
        'Amount',
        'Expenses',
        'Savings',
        'Investments',
        'Saved + invested ratio',
      ],
      ...data.transactions.map((item) => [
        'Activity',
        item.date,
        item.type,
        item.parent,
        item.label,
        item.accountLabel,
        item.amount,
        '',
        '',
        '',
        '',
      ]),
      ...(['7d', '30d', '6m', '1y'] as Period[]).map((period) => {
        const result = analyze(data.transactions, periodDays[period]);
        return [
          'Analytics',
          period,
          '',
          '',
          '',
          '',
          '',
          result.expenses,
          result.savings,
          result.investments,
          `${Math.round(result.ratio * 100)}%`,
        ];
      }),
    ];
    download(
      rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n'),
      `opentrackerfi-activity-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8',
    );
  }
  function printReport() {
    const safe = (value: unknown) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    const analyticsRows = (['7d', '30d', '6m', '1y'] as Period[])
      .map((period) => {
        const result = analyze(data.transactions, periodDays[period]);
        return `<tr><td>${period}</td><td>${peso.format(result.expenses)}</td><td>${peso.format(result.savings)}</td><td>${peso.format(result.investments)}</td><td>${Math.round(result.ratio * 100)}%</td></tr>`;
      })
      .join('');
    const activityRows = data.transactions
      .map(
        (item) =>
          `<tr><td>${safe(new Date(item.date).toLocaleDateString('en-PH'))}</td><td>${safe(item.type)}</td><td>${safe(item.parent)}</td><td>${safe(item.label)}</td><td>${safe(item.accountLabel)}</td><td>${peso.format(item.amount)}</td></tr>`,
      )
      .join('');
    const report = window.open('', '_blank');
    if (!report) {
      alert('Allow pop-ups to open the printable report.');
      return;
    }
    report.document.write(
      `<!doctype html><html><head><title>OpenTrackerFi finance report</title><style>body{font:14px system-ui;color:#17251d;max-width:920px;margin:32px auto;padding:0 20px}h1,h2{color:#006b42}small{color:#66736b}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #ccd8d0;border-radius:12px;padding:14px}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{border-bottom:1px solid #dce5df;padding:8px;text-align:left}th{background:#edf6f1}@media print{body{margin:0}.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">Print or save as PDF</button><h1>OpenTrackerFi activity and analytics report</h1><small>Generated ${safe(new Date().toLocaleString('en-PH'))}</small><h2>Salary-based projection</h2><div class="cards"><div class="card">Monthly salary<br><strong>${peso.format(data.salary)}</strong></div><div class="card">Expenses logged this month<br><strong>${peso.format(summary.expenses)}</strong></div><div class="card">Projected salary-based balance<br><strong>${peso.format(summary.projected)}</strong></div></div><p>Formula: monthly salary - current-month expense entries. Monthly allocations are excluded.</p><h2>Analytics</h2><table><thead><tr><th>Period</th><th>Expenses</th><th>Savings</th><th>Investments</th><th>Ratio</th></tr></thead><tbody>${analyticsRows}</tbody></table><h2>Activity</h2><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Account</th><th>Amount</th></tr></thead><tbody>${activityRows || '<tr><td colspan="6">No recorded activity.</td></tr>'}</tbody></table></body></html>`,
    );
    report.document.close();
  }
  function zeroEverything() {
    if (
      !confirm(
        'This will permanently remove every account, activity, adjustment, allocation breakdown, and current plan value from this device. Export a backup first if needed. Continue?',
      )
    )
      return;
    if (prompt('Type ZERO to confirm permanent deletion.') !== 'ZERO') return;
    setData((current) => ({
      ...current,
      salary: 0,
      emergencyTarget: 0,
      plan: {
        minSavingsPercent: 0,
        maxSavingsPercent: 0,
        maxInvestmentPercent: 0,
      },
      accounts: [],
      subcategories: [],
      transactions: [],
      adjustments: [],
    }));
    setOpen(false);
  }
  async function exportEncrypted() {
    if (!password) return;
    download(
      JSON.stringify(await encryptBackup(data, password)),
      `opentrackerfi-backup-${new Date().toISOString().slice(0, 10)}.encrypted.json`,
    );
  }
  async function restore(file: File) {
    try {
      const raw = JSON.parse(await file.text());
      const restored = raw?.ciphertext
        ? await decryptBackup(raw, password)
        : raw;
      setData(migrate(restored));
      alert('Backup restored successfully.');
    } catch {
      alert('Could not restore this backup. Check the file and password.');
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings & backup</DialogTitle>
          <DialogDescription>
            Your finance data remains on this device unless you export it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm font-semibold">
            Monthly salary
            <Input
              className="mt-1"
              type="number"
              min="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Next payday
            <Input
              className="mt-1"
              type="date"
              value={payday}
              onChange={(e) => setPayday(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Emergency fund target
            <Input
              className="mt-1"
              type="number"
              min="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </label>
          <Button className="w-full" type="submit">
            Save plan settings
          </Button>
        </form>
        <div className="border-t pt-4">
          <p className="mb-1 font-semibold">Export reports</p>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            Export all recorded activities with 7-day, 30-day, 6-month, and
            yearly analytics.
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download /> Export CSV
            </Button>
            <Button variant="outline" onClick={printReport}>
              <Printer /> Printable PDF
            </Button>
          </div>
          <p className="mb-1 font-semibold">Backup & restore</p>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            Plain JSON is convenient but readable by anyone with the file.
            Encrypted backups require the password and cannot be recovered if it
            is forgotten.
          </p>
          <Input
            className="mb-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password for encrypted backup/restore"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() =>
                download(
                  JSON.stringify(data, null, 2),
                  `opentrackerfi-backup-${new Date().toISOString().slice(0, 10)}.json`,
                )
              }
            >
              <Download /> Plain JSON
            </Button>
            <Button
              variant="outline"
              onClick={exportEncrypted}
              disabled={!password}
            >
              <ShieldCheck /> Encrypted
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
          />
          <Button
            variant="outline"
            className="mt-2 w-full"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp /> Restore backup
          </Button>
        </div>
        <div className="border-t pt-4">
          <p className="mb-1 font-semibold text-destructive">Zero everything</p>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            Permanently delete all accounts, activities, adjustments, allocation
            breakdowns, salary, savings targets, and plan values. Fixed category
            names and app preferences remain.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={zeroEverything}
          >
            <RotateCcw /> Zero everything
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
