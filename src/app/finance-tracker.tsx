'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Home, Moon, ReceiptText, Settings, Sun, Target, WalletCards, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { View, ParentCategory, Transaction, FinanceData, Summary } from '@/src/types/finance';
import { seedData, uid, accountName, isCashflow, daysUntil } from '@/src/lib/finance';
import { loadData } from '@/src/services/local-storage';
import { Dashboard } from '@/src/features/dashboard/dashboard';
import { Activity } from '@/src/features/activity/activity';
import { Plan } from '@/src/features/plans/plan';
import { Accounts } from '@/src/features/accounts/accounts';
import { BreakdownDialog } from '@/src/features/allocations/breakdown-dialog';
import { AddDialog } from '@/src/features/activity/add-dialog';
import { SettingsDialog } from '@/src/features/settings/settings-dialog';
import { InfoTip } from '@/src/components/finance-ui';

export default function HomePage() {
  const [view, setView] = useState<View>('home');
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<FinanceData>(seedData);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<ParentCategory | null>(null);

  useEffect(() => {
    setData(loadData());
    const savedDark = localStorage.getItem('sahod-theme') === 'dark';
    setDark(savedDark);
    document.documentElement.classList.toggle('dark', savedDark);
    setOnline(navigator.onLine);
    setReady(true);
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    window.addEventListener('online', yes);
    window.addEventListener('offline', no);
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    return () => {
      window.removeEventListener('online', yes);
      window.removeEventListener('offline', no);
    };
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem('sahod-data', JSON.stringify(data));
  }, [data, ready]);

  const summary = useMemo<Summary>(() => {
    const liquid = data.accounts
      .filter((a) => !a.archived)
      .reduce((sum, item) => sum + item.balance, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyEntries = data.transactions.filter(
      (item) => new Date(item.date) >= monthStart,
    );
    const expenses = monthlyEntries
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    const savings = monthlyEntries
      .filter((item) => item.type === 'saving')
      .reduce((sum, item) => sum + item.amount, 0);
    const investments = monthlyEntries
      .filter((item) => item.type === 'investment')
      .reduce((sum, item) => sum + item.amount, 0);
    const reserved = 0;
    const days = daysUntil(data.nextPayday);
    const dailyAverage = expenses / Math.max(1, new Date().getDate());
    const estimatedRemaining = expenses;
    const unpaidReserve = 0;
    const projected = data.salary - expenses;
    const safe = Math.max(0, projected / days);
    const ratio = expenses ? (savings + investments) / expenses : 0;
    return {
      liquid,
      expenses,
      savings,
      investments,
      reserved,
      dailyAverage,
      estimatedRemaining,
      remainingTarget: unpaidReserve,
      days,
      projected,
      safe,
      ratio,
    };
  }, [data]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('sahod-theme', next ? 'dark' : 'light');
  }
  function addTransaction(
    entry: Omit<Transaction, 'id' | 'date' | 'accountLabel'>,
  ) {
    const account = data.accounts.find((a) => a.id === entry.accountId);
    setData((current) => ({
      ...current,
      accounts: current.accounts.map((a) =>
        a.id === entry.accountId && isCashflow(entry.type)
          ? {
              ...a,
              balance:
                a.balance +
                (['income', 'withdrawal'].includes(entry.type)
                  ? entry.amount
                  : -entry.amount),
            }
          : a,
      ),
      transactions: [
        {
          ...entry,
          id: uid(),
          date: new Date().toISOString(),
          accountLabel: account ? accountName(account) : 'No account',
        },
        ...current.transactions,
      ],
    }));
    setAddOpen(false);
  }

  const nav = [
    { id: 'home' as View, label: 'Home', icon: Home },
    { id: 'activity' as View, label: 'Activity', icon: ReceiptText },
    { id: 'plan' as View, label: 'Plan', icon: Target },
    { id: 'accounts' as View, label: 'Accounts', icon: WalletCards },
  ];
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto min-h-screen max-w-6xl pb-28">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-5 py-4 backdrop-blur-xl md:px-8">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-3 text-left"
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <CircleDollarSign className="size-5" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase tracking-[.16em] text-muted-foreground">
                  Plan. Manage. Track.
                </span>
                <span className="block text-lg font-bold">OpenTrackerFi</span>
              </span>
            </button>
            <div className="flex items-center gap-1">
              <span
                className={`mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex ${online ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}
              >
                {online ? (
                  <span className="size-2 rounded-full bg-emerald-500" />
                ) : (
                  <WifiOff className="size-3.5" />
                )}
                {online ? 'Stored locally' : 'Offline mode'}
              </span>
              <InfoTip text={dark ? 'Use light mode' : 'Use dark mode'}>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={toggleTheme}
                  aria-label="Toggle color mode"
                >
                  {dark ? <Sun /> : <Moon />}
                </Button>
              </InfoTip>
              <InfoTip text="Salary, payday, exports, and local data settings">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  onClick={() => setSettingsOpen(true)}
                  aria-label="Open settings"
                >
                  <Settings />
                </Button>
              </InfoTip>
            </div>
          </header>
          <section className="px-5 py-6 md:px-8 md:py-8">
            {view === 'home' && (
              <Dashboard
                data={data}
                summary={summary}
                setView={setView}
                onBreakdown={setBreakdown}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            )}
            {view === 'activity' && (
              <Activity
                data={data}
                setData={setData}
                onLogExpense={() => setAddOpen(true)}
              />
            )}
            {view === 'plan' && (
              <Plan data={data} summary={summary} setData={setData} />
            )}
            {view === 'accounts' && <Accounts data={data} setData={setData} />}
          </section>
          <nav className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 justify-around rounded-[1.4rem] border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
            {nav.map((item) => {
              const Icon = item.icon,
                active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <AddDialog
          open={addOpen}
          setOpen={setAddOpen}
          data={data}
          onAdd={addTransaction}
          onNeedAccount={() => {
            setAddOpen(false);
            setView('accounts');
          }}
        />
        <SettingsDialog
          open={settingsOpen}
          setOpen={setSettingsOpen}
          data={data}
          summary={summary}
          setData={setData}
        />
        <BreakdownDialog
          parent={breakdown}
          setParent={setBreakdown}
          data={data}
          setData={setData}
        />
      </main>
    </TooltipProvider>
  );
}
