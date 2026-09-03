"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  FileUp,
  Home,
  Landmark,
  Moon,
  Pencil,
  PiggyBank,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from "recharts";

type View = "home" | "activity" | "plan" | "accounts";
type ParentCategory =
  | "Food"
  | "Transport"
  | "Bills"
  | "Shopping"
  | "Health"
  | "Savings"
  | "Investments"
  | "Other";
type EntryType = "expense" | "income" | "saving" | "investment" | "withdrawal" | "value_adjustment";
type Period = "7d" | "30d" | "6m" | "1y";
type Subcategory = {
  id: string;
  parent: ParentCategory;
  name: string;
  plannedAmount: number;
  archived: boolean;
};
type Account = {
  id: string;
  provider: string;
  nickname: string;
  type: string;
  balance: number;
  archived: boolean;
};
type Transaction = {
  id: string;
  type: EntryType;
  amount: number;
  parent: ParentCategory | "Income";
  subcategoryId?: string;
  label: string;
  accountId?: string;
  accountLabel: string;
  date: string;
  note?: string;
};
type Adjustment = {
  id: string;
  accountId: string;
  amount: number;
  reason: string;
  date: string;
};
type PlanPreferences = {
  minSavingsPercent: number;
  maxSavingsPercent: number;
  maxInvestmentPercent: number;
};
type FinanceData = {
  version: 4;
  salary: number;
  nextPayday: string;
  emergencyTarget: number;
  plan: PlanPreferences;
  accounts: Account[];
  subcategories: Subcategory[];
  transactions: Transaction[];
  adjustments: Adjustment[];
};
type Summary = {
  liquid: number;
  expenses: number;
  savings: number;
  investments: number;
  reserved: number;
  dailyAverage: number;
  estimatedRemaining: number;
  remainingTarget: number;
  days: number;
  projected: number;
  safe: number;
  ratio: number;
};

const parents: ParentCategory[] = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Savings",
  "Investments",
  "Other",
];
const parentColors: Record<ParentCategory, string> = {
  Food: "bg-emerald-500",
  Transport: "bg-blue-500",
  Bills: "bg-amber-500",
  Shopping: "bg-violet-500",
  Health: "bg-rose-500",
  Savings: "bg-cyan-500",
  Investments: "bg-indigo-500",
  Other: "bg-zinc-500",
};
const seedData: FinanceData = {
  version: 4,
  salary: 12000,
  nextPayday: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15)
    .toISOString()
    .slice(0, 10),
  emergencyTarget: 24000,
  plan: {
    minSavingsPercent: 10,
    maxSavingsPercent: 20,
    maxInvestmentPercent: 10,
  },
  accounts: [
    {
      id: "gcash-main",
      provider: "GCash",
      nickname: "Main wallet",
      type: "E-wallet",
      balance: 3250,
      archived: false,
    },
    {
      id: "maribank-save",
      provider: "MariBank",
      nickname: "Emergency fund",
      type: "Savings",
      balance: 4800,
      archived: false,
    },
    {
      id: "cash",
      provider: "Cash",
      nickname: "Pocket cash",
      type: "Cash",
      balance: 950,
      archived: false,
    },
  ],
  subcategories: [
    {
      id: "groceries",
      parent: "Food",
      name: "Groceries",
      plannedAmount: 2400,
      archived: false,
    },
    {
      id: "food-allowance",
      parent: "Food",
      name: "Food allowance",
      plannedAmount: 1200,
      archived: false,
    },
    {
      id: "commute",
      parent: "Transport",
      name: "Daily commute",
      plannedAmount: 1200,
      archived: false,
    },
    {
      id: "water",
      parent: "Bills",
      name: "Water bill",
      plannedAmount: 500,
      archived: false,
    },
    {
      id: "loan",
      parent: "Bills",
      name: "Loan payment",
      plannedAmount: 1000,
      archived: false,
    },
    {
      id: "tuition",
      parent: "Bills",
      name: "Tuition",
      plannedAmount: 0,
      archived: false,
    },
    {
      id: "personal",
      parent: "Shopping",
      name: "Personal items",
      plannedAmount: 500,
      archived: false,
    },
    {
      id: "medicine",
      parent: "Health",
      name: "Medicine",
      plannedAmount: 300,
      archived: false,
    },
    {
      id: "emergency",
      parent: "Savings",
      name: "Emergency fund",
      plannedAmount: 1200,
      archived: false,
    },
    {
      id: "long-term",
      parent: "Investments",
      name: "Long-term fund",
      plannedAmount: 600,
      archived: false,
    },
    {
      id: "misc",
      parent: "Other",
      name: "Miscellaneous",
      plannedAmount: 300,
      archived: false,
    },
  ],
  transactions: [
    {
      id: "1",
      type: "expense",
      amount: 185,
      parent: "Food",
      subcategoryId: "groceries",
      label: "Groceries",
      accountId: "gcash-main",
      accountLabel: "GCash · Main wallet",
      date: new Date().toISOString(),
    },
    {
      id: "2",
      type: "expense",
      amount: 120,
      parent: "Transport",
      subcategoryId: "commute",
      label: "Daily commute",
      accountId: "cash",
      accountLabel: "Cash · Pocket cash",
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      type: "expense",
      amount: 499,
      parent: "Bills",
      subcategoryId: "water",
      label: "Water bill",
      accountId: "gcash-main",
      accountLabel: "GCash · Main wallet",
      date: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "4",
      type: "income",
      amount: 12000,
      parent: "Income",
      label: "Salary",
      accountId: "maribank-save",
      accountLabel: "MariBank · Emergency fund",
      date: new Date(Date.now() - 604800000).toISOString(),
    },
  ],
  adjustments: [],
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const periodDays: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "6m": 183,
  "1y": 365,
};
const uid = () => crypto.randomUUID();
const accountName = (account: Account) =>
  `${account.provider}${account.nickname ? ` · ${account.nickname}` : ""}`;
const isOutflow = (type: EntryType) => ["expense", "saving", "investment"].includes(type);
const isCashflow = (type: EntryType) => type !== "value_adjustment";
const dateWithin = (date: string, days: number) =>
  new Date(date).getTime() >= Date.now() - days * 86400000;
const daysUntil = (date: string) =>
  Math.max(1, Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000));

function migrate(raw: unknown): FinanceData {
  if (!raw || typeof raw !== "object") return seedData;
  const old = raw as Partial<FinanceData> & { categories?: string[] };
  if (
    (old.version === 3 || old.version === 4) &&
    old.subcategories &&
    old.accounts &&
    old.transactions
  )
    return {
      ...old,
      version: 4,
      plan: old.plan || seedData.plan,
    } as FinanceData;
  const legacyAccounts = (old.accounts || []).map((item: Account & { name?: string }) => ({
    id: item.id || uid(),
    provider: item.provider || item.name || "Account",
    nickname: item.nickname || "",
    type: item.type || "E-wallet",
    balance: Number(item.balance) || 0,
    archived: false,
  }));
  const categoryNames = old.categories?.length ? old.categories : parents;
  const subcategories = categoryNames.map((name) => ({
    id: `legacy-${name.toLowerCase().replace(/\W+/g, "-")}`,
    parent: (parents.includes(name as ParentCategory) ? name : "Other") as ParentCategory,
    name,
    plannedAmount: 0,
    archived: false,
  }));
  const transactions = (old.transactions || []).map(
    (item: Transaction & { category?: string; account?: string }) => {
      const label = item.label || item.category || "Other";
      const sub = subcategories.find((s) => s.name === label);
      const account = legacyAccounts.find(
        (a) => a.provider === item.account || accountName(a) === item.account,
      );
      return {
        ...item,
        id: item.id || uid(),
        parent: item.type === "income" ? "Income" : sub?.parent || "Other",
        subcategoryId: sub?.id,
        label,
        accountId: item.accountId || account?.id,
        accountLabel: item.accountLabel || item.account || "Archived account",
      } as Transaction;
    },
  );
  return {
    version: 4,
    salary: Number(old.salary) || 0,
    nextPayday: old.nextPayday || seedData.nextPayday,
    emergencyTarget: Number(old.emergencyTarget) || 0,
    plan: seedData.plan,
    accounts: legacyAccounts.length ? legacyAccounts : seedData.accounts,
    subcategories,
    transactions,
    adjustments: [],
  };
}

function loadData() {
  try {
    return migrate(JSON.parse(localStorage.getItem("sahod-data") || ""));
  } catch {
    return seedData;
  }
}

export default function HomePage() {
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(false);
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<FinanceData>(seedData);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [breakdown, setBreakdown] = useState<ParentCategory | null>(null);

  useEffect(() => {
    setData(loadData());
    const savedDark = localStorage.getItem("sahod-theme") === "dark";
    setDark(savedDark);
    document.documentElement.classList.toggle("dark", savedDark);
    setOnline(navigator.onLine);
    setReady(true);
    const yes = () => setOnline(true),
      no = () => setOnline(false);
    window.addEventListener("online", yes);
    window.addEventListener("offline", no);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => {
      window.removeEventListener("online", yes);
      window.removeEventListener("offline", no);
    };
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("sahod-data", JSON.stringify(data));
  }, [data, ready]);

  const summary = useMemo<Summary>(() => {
    const liquid = data.accounts
      .filter((a) => !a.archived && !["Investment", "Crypto"].includes(a.type))
      .reduce((sum, item) => sum + item.balance, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyEntries = data.transactions.filter((item) => new Date(item.date) >= monthStart);
    const expenses = monthlyEntries
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);
    const savings = monthlyEntries
      .filter((item) => item.type === "saving")
      .reduce((sum, item) => sum + item.amount, 0);
    const investments = monthlyEntries
      .filter((item) => item.type === "investment")
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
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sahod-theme", next ? "dark" : "light");
  }
  function addTransaction(entry: Omit<Transaction, "id" | "date" | "accountLabel">) {
    const account = data.accounts.find((a) => a.id === entry.accountId);
    setData((current) => ({
      ...current,
      accounts: current.accounts.map((a) =>
        a.id === entry.accountId && isCashflow(entry.type)
          ? {
              ...a,
              balance:
                a.balance +
                (["income", "withdrawal"].includes(entry.type) ? entry.amount : -entry.amount),
            }
          : a,
      ),
      transactions: [
        {
          ...entry,
          id: uid(),
          date: new Date().toISOString(),
          accountLabel: account ? accountName(account) : "No account",
        },
        ...current.transactions,
      ],
    }));
    setAddOpen(false);
  }

  const nav = [
    { id: "home" as View, label: "Home", icon: Home },
    { id: "activity" as View, label: "Activity", icon: ReceiptText },
    { id: "plan" as View, label: "Plan", icon: Target },
    { id: "accounts" as View, label: "Accounts", icon: WalletCards },
  ];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen max-w-6xl pb-28">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/70 bg-background/90 px-5 py-4 backdrop-blur-xl md:px-8">
          <button onClick={() => setView("home")} className="flex items-center gap-3 text-left">
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
              className={`mr-1 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex ${online ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}
            >
              {online ? (
                <span className="size-2 rounded-full bg-emerald-500" />
              ) : (
                <WifiOff className="size-3.5" />
              )}
              {online ? "Stored locally" : "Offline mode"}
            </span>
            <Button variant="ghost" size="icon-lg" onClick={toggleTheme}>
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" size="icon-lg" onClick={() => setSettingsOpen(true)}>
              <Settings />
            </Button>
          </div>
        </header>
        <section className="px-5 py-6 md:px-8 md:py-8">
          {view === "home" && (
            <Dashboard data={data} summary={summary} setView={setView} onBreakdown={setBreakdown} />
          )}
          {view === "activity" && (
            <Activity data={data} setData={setData} onLogExpense={() => setAddOpen(true)} />
          )}
          {view === "plan" && <Plan data={data} summary={summary} setData={setData} />}
          {view === "accounts" && <Accounts data={data} setData={setData} />}
        </section>
        <nav className="fixed bottom-3 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 justify-around rounded-[1.4rem] border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-xl">
          {nav.map((item) => {
            const Icon = item.icon,
              active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <AddDialog open={addOpen} setOpen={setAddOpen} data={data} onAdd={addTransaction} />
      <SettingsDialog
        open={settingsOpen}
        setOpen={setSettingsOpen}
        data={data}
        summary={summary}
        setData={setData}
      />
      <BreakdownDialog parent={breakdown} setParent={setBreakdown} data={data} setData={setData} />
    </main>
  );
}

function Dashboard({
  data,
  summary,
  setView,
  onBreakdown,
}: {
  data: FinanceData;
  summary: Summary;
  setView: (v: View) => void;
  onBreakdown: (p: ParentCategory) => void;
}) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const activeSubcategoryIds = new Set(
    data.subcategories.filter((s) => !s.archived).map((s) => s.id),
  );
  const activeMonthlyExpenses = data.transactions.filter(
    (t) =>
      t.type === "expense" &&
      new Date(t.date) >= monthStart &&
      (!t.subcategoryId || activeSubcategoryIds.has(t.subcategoryId)),
  );
  const grouped = parents
    .map((parent) => ({
      parent,
      amount: data.subcategories
        .filter((s) => !s.archived && s.parent === parent)
        .reduce((sum, subcategory) => sum + subcategory.plannedAmount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const totalMonthlyAllocations = grouped.reduce((sum, item) => sum + item.amount, 0);
  const monthlyPercent = Math.min(
    100,
    data.salary > 0 ? (totalMonthlyAllocations / data.salary) * 100 : 0,
  );
  const spike = getSpike(activeMonthlyExpenses, Math.max(1, new Date().getDate()));
  const expenseDayCount = new Set(activeMonthlyExpenses.map((item) => item.date.slice(0, 10))).size;
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Your plan. Your pace. Every peso on track.
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Stay ahead of payday.
          </h1>
        </div>
        <span className="rounded-full bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
          {summary.days} days until payday
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground md:col-span-2">
          <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/7" />
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[.15em] opacity-70">
              Active account balance
            </p>
            <CardTitle className="text-4xl font-bold md:text-5xl">
              {peso.format(summary.liquid)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between gap-4">
            <div>
              <p className="text-sm opacity-70">Safe today</p>
              <p className="text-xl font-bold">{peso.format(summary.safe)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-70">Salary minus expenses</p>
              <p className={`text-xl font-bold ${summary.projected < 0 ? "text-amber-200" : ""}`}>
                {peso.format(summary.projected)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> Plan pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Logged expenses vs saved/invested</p>
              <p className="text-2xl font-bold">{Math.round(summary.ratio * 100)}%</p>
            </div>
            {expenseDayCount < 7 ? (
              <p className="text-xs text-muted-foreground">
                Log expenses for at least 7 days to detect spending spikes.
              </p>
            ) : spike ? (
              <p className="flex gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="size-4 shrink-0" />
                {spike}
              </p>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Spending looks steady this month.
              </p>
            )}
            <button
              onClick={() => setView("plan")}
              className="flex items-center text-xs font-bold text-primary"
            >
              Full analytics <ChevronRight className="size-4" />
            </button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly allocations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Plan monthly amounts by category and customize each breakdown.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold">
                  {peso.format(totalMonthlyAllocations)} allocated
                </span>
                <span className="text-muted-foreground">
                  {Math.round(monthlyPercent)}% of {peso.format(data.salary)}
                </span>
              </div>
              <Progress value={monthlyPercent} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {grouped.map((item) => (
                <button
                  key={item.parent}
                  onClick={() => onBreakdown(item.parent)}
                  className="flex items-center gap-3 rounded-xl bg-muted/70 p-3 text-left transition hover:bg-muted"
                >
                  <span className={`size-2.5 rounded-full ${parentColors[item.parent]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-muted-foreground">
                      {item.parent}
                    </span>
                    <span className="block text-lg font-bold">{peso.format(item.amount)}</span>
                  </span>
                  <Eye className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex justify-between">
              <CardTitle>Recent activity</CardTitle>
              <button
                onClick={() => setView("activity")}
                className="text-xs font-bold text-primary"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {data.transactions.slice(0, 4).map((t) => (
              <TransactionRow key={t.id} item={t} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Activity({
  data,
  setData,
  onLogExpense,
}: {
  data: FinanceData;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
  onLogExpense: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "expense" | "income" | "saving" | "investment">(
    "all",
  );
  const items = data.transactions.filter((t) => filter === "all" || t.type === filter);
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
                        a.balance + (isOutflow(removed.type) ? removed.amount : -removed.amount),
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Every peso, accounted for.</p>
          <h1 className="text-3xl font-bold">Activity</h1>
        </div>
        <Button onClick={onLogExpense}>
          <Plus /> Log daily expense
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "expense", "income", "saving", "investment"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <EntryIcon type={t.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{t.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.parent} · {t.accountLabel} · {new Date(t.date).toLocaleDateString("en-PH")}
                </p>
              </div>
              <p
                className={`font-bold ${["income", "withdrawal"].includes(t.type) ? "text-emerald-600" : ""}`}
              >
                {["income", "withdrawal"].includes(t.type) ? "+" : "−"}
                {peso.format(t.amount)}
              </p>
              <Button variant="ghost" size="icon-sm" onClick={() => remove(t.id)}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {!items.length && (
            <p className="p-8 text-center text-muted-foreground">No entries here yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const activityChartConfig = {
  expenses: { label: "Expenses", color: "#e11d48" },
  savings: { label: "Savings", color: "#059669" },
  investments: { label: "Investments", color: "#4f46e5" },
  planned: { label: "Salary-based expense limit", color: "#d97706" },
} satisfies ChartConfig;

function Plan({
  data,
  summary,
  setData,
}: {
  data: FinanceData;
  summary: Summary;
  setData: React.Dispatch<React.SetStateAction<FinanceData>>;
}) {
  const [period, setPeriod] = useState<Period>("30d");
  const [minSavings, setMinSavings] = useState(String(data.plan.minSavingsPercent));
  const [maxSavings, setMaxSavings] = useState(String(data.plan.maxSavingsPercent));
  const [maxInvestment, setMaxInvestment] = useState(String(data.plan.maxInvestmentPercent));
  const analytics = useMemo(
    () => analyze(data.transactions, periodDays[period]),
    [data.transactions, period],
  );
  const savingsBalance = data.accounts
    .filter((a) => !a.archived && a.type === "Savings")
    .reduce((s, a) => s + a.balance, 0);
  const chartSeries = useMemo(() => activitySeries(data, period), [data, period]);
  const chartTitle =
    period === "7d"
      ? "Last 7 days"
      : period === "30d"
        ? "Last 30 days"
        : period === "6m"
          ? "Last 6 months"
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
          {(["7d", "30d", "6m", "1y"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${period === p ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {p === "6m" ? "6 months" : p === "1y" ? "Year" : p}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Expenses" value={peso.format(analytics.expenses)} icon={<TrendingDown />} />
        <Metric label="Saved" value={peso.format(analytics.savings)} icon={<PiggyBank />} />
        <Metric label="Invested" value={peso.format(analytics.investments)} icon={<TrendingUp />} />
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
              Peaks mark periods where expenses reached the salary-based limit or exceeded savings
              and investments combined.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer config={activityChartConfig} className="h-[300px] w-full aspect-auto">
              <LineChart data={chartSeries} margin={{ top: 24, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₱${Math.round(Number(value) / 1000)}k`}
                  width={42}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_value, payload) =>
                        String(payload?.[0]?.payload?.dateLabel || "Activity")
                      }
                      formatter={(value, name) => (
                        <div className="flex w-full min-w-40 items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {activityChartConfig[name as keyof typeof activityChartConfig]?.label ||
                              String(name)}
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
                        value: item.shortDate ? `Expense peak · ${item.shortDate}` : "Expense peak",
                        position: "top",
                        fill: "#b45309",
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
              <CardTitle>Salary-based projection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly salary</span>
                <b>{peso.format(data.salary)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses logged this month</span>
                <b>
                  {peso.format(summary.expenses)} ·{" "}
                  {Math.round((summary.expenses / Math.max(1, data.salary)) * 100)}%
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Savings logged this month</span>
                <b>
                  {peso.format(summary.savings)} ·{" "}
                  {Math.round((summary.savings / Math.max(1, data.salary)) * 100)}%
                </b>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Investments logged this month</span>
                <b>
                  {peso.format(summary.investments)} ·{" "}
                  {Math.round((summary.investments / Math.max(1, data.salary)) * 100)}%
                </b>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Daily expense average</span>
                <b>{peso.format(summary.dailyAverage)}</b>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">Projected salary-based balance</p>
                <p
                  className={`text-3xl font-bold ${summary.projected < 0 ? "text-amber-600" : ""}`}
                >
                  {peso.format(summary.projected)}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Monthly salary minus expense entries logged during the current month. Monthly allocations are excluded.
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
                value={Math.min(100, (savingsBalance / Math.max(1, data.emergencyTarget)) * 100)}
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
          <form onSubmit={savePlan} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
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
              Minimum savings:{" "}
              <b className="text-foreground">
                {peso.format((data.salary * data.plan.minSavingsPercent) / 100)}
              </b>
            </p>
            <p>
              Maximum savings:{" "}
              <b className="text-foreground">
                {peso.format((data.salary * data.plan.maxSavingsPercent) / 100)}
              </b>
            </p>
            <p>
              Investment cap:{" "}
              <b className="text-foreground">
                {peso.format((data.salary * data.plan.maxInvestmentPercent) / 100)}
              </b>
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="flex gap-3">
          <ShieldCheck className="size-5 shrink-0 text-indigo-600" />
          <p className="text-sm leading-6 text-muted-foreground">
            <b className="text-foreground">Manual investment values only.</b> Investment amounts
            shown here use your initial entries and manual adjustments. Actual value may differ from
            DragonFi, GStocks, GFunds, Binance, MEXC, or another platform because market
            fluctuations are not integrated yet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Accounts({
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
      accounts: c.accounts.map((a) => (a.id === account.id ? { ...a, archived: true } : a)),
    }));
  }
  function restore(account: Account) {
    setData((c) => ({
      ...c,
      accounts: c.accounts.map((a) => (a.id === account.id ? { ...a, archived: false } : a)),
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
            {showArchived ? "Hide removed" : "Show removed"}
          </Button>
          <Button onClick={() => setAdding(true)}>
            <Plus /> Add account
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((account) => (
          <Card key={account.id} className={account.archived ? "opacity-60" : ""}>
            <CardContent className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                {account.type === "Cash" ? (
                  <CircleDollarSign />
                ) : account.type === "Savings" ? (
                  <Landmark />
                ) : (
                  <CreditCard />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{account.provider}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.nickname || account.type}
                  {account.archived ? " · Removed from summaries" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{peso.format(account.balance)}</p>
                <div className="mt-1 flex justify-end gap-1">
                  {account.archived ? (
                    <Button size="xs" variant="outline" onClick={() => restore(account)}>
                      Restore
                    </Button>
                  ) : (
                    <>
                      <Button size="icon-xs" variant="ghost" onClick={() => setEditing(account)}>
                        <Pencil />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => archive(account)}>
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
        Removed accounts no longer contribute their current balance to dashboard summaries or
        projections. Income, expenses, savings, and investments previously recorded from them remain
        in your historical analytics.
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

function AccountDialog({
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
  const [provider, setProvider] = useState("GCash"),
    [nickname, setNickname] = useState(""),
    [type, setType] = useState("E-wallet"),
    [balance, setBalance] = useState("0"),
    [reason, setReason] = useState("");
  useEffect(() => {
    if (open) {
      setProvider(account?.provider || "GCash");
      setNickname(account?.nickname || "");
      setType(account?.type || "E-wallet");
      setBalance(String(account?.balance || 0));
      setReason("");
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
          a.id === account.id ? { ...a, provider, nickname, type, balance: nextBalance } : a,
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
            type,
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
          <DialogTitle>{account ? "Edit account" : "Add account"}</DialogTitle>
          <DialogDescription>Account changes are stored only on this device.</DialogDescription>
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
            Account type
            <select
              className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>E-wallet</option>
              <option>Savings</option>
              <option>Cash</option>
              <option>Investment</option>
              <option>Crypto</option>
            </select>
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
              Reason for balance edit
              <Input
                className="mt-1"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Correction, interest earned, manual market value…"
                required
              />
            </label>
          )}
          <Button className="w-full" type="submit">
            Save account
          </Button>
        </form>
        {account && data.adjustments.filter((a) => a.accountId === account.id).length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent adjustments
            </p>
            {data.adjustments
              .filter((a) => a.accountId === account.id)
              .slice(0, 3)
              .map((a) => (
                <p key={a.id} className="text-xs text-muted-foreground">
                  {a.amount >= 0 ? "+" : ""}
                  {peso.format(a.amount)} · {a.reason}
                </p>
              ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BreakdownDialog({
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
  const [name, setName] = useState(""),
    [planned, setPlanned] = useState("0"),
    [showArchived, setShowArchived] = useState(false);
  if (!parent) return null;
  const subs = data.subcategories.filter(
    (s) => s.parent === parent && (showArchived || !s.archived),
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
          parent,
          name: name.trim(),
          plannedAmount: Number(planned),
          archived: false,
        },
      ],
    }));
    setName("");
    setPlanned("0");
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
            Allocate monthly amounts across subcategories. These are tracking labels, not bills or
            payment schedules. Parent categories stay fixed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={add} className="grid grid-cols-[1fr_7rem_auto] gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={parent === "Bills" ? "Loan, tuition, water…" : "New subcategory"}
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
              sub.parent === "Savings"
                ? "saving"
                : sub.parent === "Investments"
                  ? "investment"
                  : "expense";
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
                className={`rounded-xl border p-3 ${sub.archived ? "opacity-60" : ""}`}
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
                  <Button variant="ghost" size="icon-sm" onClick={() => archive(sub)}>
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
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
          <p className="text-xs text-muted-foreground">
            Allocation total:{" "}
            {peso.format(
              subs.filter((s) => !s.archived).reduce((sum, s) => sum + s.plannedAmount, 0),
            )}
          </p>
        </div>
        <p className="rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
          Archived allocations are removed from current tracking and new entries. Their previous
          transactions remain in overall analytics.
        </p>
        <Button className="w-full" onClick={() => setParent(null)}>
          Save changes
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AddDialog({
  open,
  setOpen,
  data,
  onAdd,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  data: FinanceData;
  onAdd: (entry: Omit<Transaction, "id" | "date" | "accountLabel">) => void;
}) {
  const activeAccounts = data.accounts.filter((a) => !a.archived),
    activeSubs = data.subcategories.filter((s) => !s.archived);
  const [type, setType] = useState<EntryType>("expense"),
    [amount, setAmount] = useState(""),
    [parent, setParent] = useState<ParentCategory>("Food"),
    [subId, setSubId] = useState(""),
    [accountId, setAccountId] = useState(""),
    [label, setLabel] = useState("");
  useEffect(() => {
    if (open) {
      setType("expense");
      setAccountId(activeAccounts[0]?.id || "");
      const first = activeSubs.find((s) => s.parent === parent);
      setSubId(first?.id || "");
    }
  }, [open]);
  const filteredSubs = activeSubs.filter((s) => s.parent === parent);
  useEffect(() => {
    if (!filteredSubs.some((s) => s.id === subId)) setSubId(filteredSubs[0]?.id || "");
  }, [parent]);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const sub = data.subcategories.find((s) => s.id === subId);
    if (!Number(amount) || !accountId) return;
    onAdd({
      type,
      amount: Number(amount),
      parent: type === "income" ? "Income" : parent,
      subcategoryId: type === "income" ? undefined : subId,
      label: type === "income" ? label || "Income" : sub?.name || parent,
      accountId,
      note: "",
    });
    setAmount("");
    setLabel("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log daily expense</DialogTitle>
          <DialogDescription>
            Expense entries are saved locally and update projections immediately. You can switch
            entry type when needed.
          </DialogDescription>
        </DialogHeader>
        {!activeAccounts.length ? (
          <p className="rounded-xl bg-amber-500/10 p-4 text-sm">
            Add or restore an account before recording an entry.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income", "saving", "investment"] as EntryType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={type === t ? "default" : "outline"}
                  onClick={() => {
                    setType(t);
                    if (t === "saving") setParent("Savings");
                    if (t === "investment") setParent("Investments");
                  }}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
            <label className="block text-sm font-semibold">
              Amount
              <Input
                className="mt-1 h-11"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            {type === "income" ? (
              <label className="block text-sm font-semibold">
                Income label
                <Input
                  className="mt-1"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Salary, freelance…"
                />
              </label>
            ) : (
              <>
                <label className="block text-sm font-semibold">
                  Category
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3"
                    value={parent}
                    onChange={(e) => setParent(e.target.value as ParentCategory)}
                    disabled={type === "saving" || type === "investment"}
                  >
                    {parents.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Breakdown
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3"
                    value={subId}
                    onChange={(e) => setSubId(e.target.value)}
                    required
                  >
                    {filteredSubs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <label className="block text-sm font-semibold">
              Account
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
            {type === "investment" && (
              <p className="rounded-xl bg-indigo-500/10 p-3 text-xs text-indigo-700 dark:text-indigo-300">
                This records your contribution at its entered value. Actual platform value may
                change with the market.
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

function SettingsDialog({
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
  const [salary, setSalary] = useState(""),
    [payday, setPayday] = useState(""),
    [target, setTarget] = useState(""),
    [password, setPassword] = useState("");
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
  function download(content: string, name: string, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportCsv() {
    const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows: unknown[][] = [
      [
        "Record type",
        "Date / period",
        "Activity type",
        "Category",
        "Description",
        "Account",
        "Amount",
        "Expenses",
        "Savings",
        "Investments",
        "Saved + invested ratio",
      ],
      ...data.transactions.map((item) => [
        "Activity",
        item.date,
        item.type,
        item.parent,
        item.label,
        item.accountLabel,
        item.amount,
        "",
        "",
        "",
        "",
      ]),
      ...(["7d", "30d", "6m", "1y"] as Period[]).map((period) => {
        const result = analyze(data.transactions, periodDays[period]);
        return [
          "Analytics",
          period,
          "",
          "",
          "",
          "",
          "",
          result.expenses,
          result.savings,
          result.investments,
          `${Math.round(result.ratio * 100)}%`,
        ];
      }),
    ];
    download(
      rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n"),
      `opentrackerfi-activity-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8",
    );
  }
  function printReport() {
    const safe = (value: unknown) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    const analyticsRows = (["7d", "30d", "6m", "1y"] as Period[])
      .map((period) => {
        const result = analyze(data.transactions, periodDays[period]);
        return `<tr><td>${period}</td><td>${peso.format(result.expenses)}</td><td>${peso.format(result.savings)}</td><td>${peso.format(result.investments)}</td><td>${Math.round(result.ratio * 100)}%</td></tr>`;
      })
      .join("");
    const activityRows = data.transactions
      .map(
        (item) =>
          `<tr><td>${safe(new Date(item.date).toLocaleDateString("en-PH"))}</td><td>${safe(item.type)}</td><td>${safe(item.parent)}</td><td>${safe(item.label)}</td><td>${safe(item.accountLabel)}</td><td>${peso.format(item.amount)}</td></tr>`,
      )
      .join("");
    const report = window.open("", "_blank");
    if (!report) {
      alert("Allow pop-ups to open the printable report.");
      return;
    }
    report.document.write(
      `<!doctype html><html><head><title>OpenTrackerFi finance report</title><style>body{font:14px system-ui;color:#17251d;max-width:920px;margin:32px auto;padding:0 20px}h1,h2{color:#006b42}small{color:#66736b}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #ccd8d0;border-radius:12px;padding:14px}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{border-bottom:1px solid #dce5df;padding:8px;text-align:left}th{background:#edf6f1}@media print{body{margin:0}.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">Print or save as PDF</button><h1>OpenTrackerFi activity and analytics report</h1><small>Generated ${safe(new Date().toLocaleString("en-PH"))}</small><h2>Salary-based projection</h2><div class="cards"><div class="card">Monthly salary<br><strong>${peso.format(data.salary)}</strong></div><div class="card">Expenses logged this month<br><strong>${peso.format(summary.expenses)}</strong></div><div class="card">Projected salary-based balance<br><strong>${peso.format(summary.projected)}</strong></div></div><p>Formula: monthly salary - current-month expense entries. Monthly allocations are excluded.</p><h2>Analytics</h2><table><thead><tr><th>Period</th><th>Expenses</th><th>Savings</th><th>Investments</th><th>Ratio</th></tr></thead><tbody>${analyticsRows}</tbody></table><h2>Activity</h2><table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Account</th><th>Amount</th></tr></thead><tbody>${activityRows || '<tr><td colspan="6">No recorded activity.</td></tr>'}</tbody></table></body></html>`,
    );
    report.document.close();
  }
  function zeroEverything() {
    if (
      !confirm(
        "This will permanently remove every account, activity, adjustment, allocation breakdown, and current plan value from this device. Export a backup first if needed. Continue?",
      )
    )
      return;
    if (prompt("Type ZERO to confirm permanent deletion.") !== "ZERO") return;
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
      const restored = raw?.ciphertext ? await decryptBackup(raw, password) : raw;
      setData(migrate(restored));
      alert("Backup restored successfully.");
    } catch {
      alert("Could not restore this backup. Check the file and password.");
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
            Export all recorded activities with 7-day, 30-day, 6-month, and yearly analytics.
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
            Plain JSON is convenient but readable by anyone with the file. Encrypted backups require
            the password and cannot be recovered if it is forgotten.
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
            <Button variant="outline" onClick={exportEncrypted} disabled={!password}>
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
            Permanently delete all accounts, activities, adjustments, allocation breakdowns, salary,
            savings targets, and plan values. Fixed category names and app preferences remain.
          </p>
          <Button type="button" variant="destructive" className="w-full" onClick={zeroEverything}>
            <RotateCcw /> Zero everything
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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
function EntryIcon({ type }: { type: EntryType }) {
  const positive = ["income", "withdrawal"].includes(type);
  return (
    <span
      className={`grid size-10 place-items-center rounded-xl ${positive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}
    >
      {positive ? <ArrowDownLeft /> : <ArrowUpRight />}
    </span>
  );
}
function TransactionRow({ item }: { item: Transaction }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <EntryIcon type={item.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">{item.accountLabel}</p>
      </div>
      <b className={["income", "withdrawal"].includes(item.type) ? "text-emerald-600" : ""}>
        {["income", "withdrawal"].includes(item.type) ? "+" : "−"}
        {peso.format(item.amount)}
      </b>
    </div>
  );
}

function activitySeries(data: FinanceData, period: Period) {
  if (period === "1y") return annualActivity(data);
  const monthlyExpenseLimit = Math.max(
    0,
    data.salary * (1 - (data.plan.minSavingsPercent + data.plan.maxInvestmentPercent) / 100),
  );
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const ranges: { start: Date; end: Date; label: string; planned: number }[] = [];

  if (period === "7d") {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(today);
      start.setDate(today.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      ranges.push({
        start,
        end,
        label: new Intl.DateTimeFormat("en", {
          weekday: "short",
          day: "numeric",
        }).format(start),
        planned: monthlyExpenseLimit / 30,
      });
    }
  } else if (period === "30d") {
    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
    for (let index = 0; index < 6; index += 1) {
      const start = new Date(rangeStart);
      start.setDate(rangeStart.getDate() + index * 5);
      const end = new Date(start);
      end.setDate(start.getDate() + 4);
      end.setHours(23, 59, 59, 999);
      ranges.push({
        start,
        end,
        label: `${new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(start)}–${new Intl.DateTimeFormat("en", { day: "numeric" }).format(end)}`,
        planned: monthlyExpenseLimit / 6,
      });
    }
  } else {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      ranges.push({
        start,
        end,
        label: new Intl.DateTimeFormat("en", { month: "short" }).format(start),
        planned: monthlyExpenseLimit,
      });
    }
  }

  return ranges.map((range) => summarizeActivityRange(data.transactions, range));
}

function summarizeActivityRange(
  transactions: Transaction[],
  range: { start: Date; end: Date; label: string; planned: number },
) {
  const records = transactions.filter((transaction) => {
    const timestamp = new Date(transaction.date).getTime();
    return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
  });
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + record.amount, 0);
  const savings = records
    .filter((record) => record.type === "saving")
    .reduce((sum, record) => sum + record.amount, 0);
  const investments = records
    .filter((record) => record.type === "investment")
    .reduce((sum, record) => sum + record.amount, 0);
  const dailyExpenses = new Map<string, number>();
  records
    .filter((record) => record.type === "expense")
    .forEach((record) => {
      const key = record.date.slice(0, 10);
      dailyExpenses.set(key, (dailyExpenses.get(key) || 0) + record.amount);
    });
  const peakDate = [...dailyExpenses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const exactDate = peakDate
    ? new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(`${peakDate}T12:00:00`))
    : `${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(range.start)} – ${new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(range.end)}`;
  return {
    month: range.label,
    dateLabel: exactDate,
    shortDate: peakDate
      ? new Intl.DateTimeFormat("en", {
          month: "short",
          day: "numeric",
        }).format(new Date(`${peakDate}T12:00:00`))
      : "",
    expenses,
    savings,
    investments,
    planned: range.planned,
    peak: expenses > 0 && (expenses >= range.planned || expenses >= savings + investments),
  };
}

function annualActivity(data: FinanceData) {
  const year = new Date().getFullYear();
  const planned = Math.max(
    0,
    data.salary * (1 - (data.plan.minSavingsPercent + data.plan.maxInvestmentPercent) / 100),
  );
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const monthTransactions = data.transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const savings = monthTransactions
      .filter((t) => t.type === "saving")
      .reduce((sum, t) => sum + t.amount, 0);
    const investments = monthTransactions
      .filter((t) => t.type === "investment")
      .reduce((sum, t) => sum + t.amount, 0);
    const dailyExpenses = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const dateKey = transaction.date.slice(0, 10);
        dailyExpenses.set(dateKey, (dailyExpenses.get(dateKey) || 0) + transaction.amount);
      });
    const peakExpenseDate = [...dailyExpenses.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const latestActivityDate = [...monthTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0]?.date;
    const displayDate = peakExpenseDate || latestActivityDate;
    return {
      month: new Intl.DateTimeFormat("en", { month: "short" }).format(
        new Date(year, monthIndex, 1),
      ),
      dateLabel: displayDate
        ? new Intl.DateTimeFormat("en", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(new Date(`${displayDate.slice(0, 10)}T12:00:00`))
        : new Intl.DateTimeFormat("en", {
            month: "long",
            year: "numeric",
          }).format(new Date(year, monthIndex, 1)),
      shortDate: peakExpenseDate
        ? new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
          }).format(new Date(`${peakExpenseDate}T12:00:00`))
        : "",
      expenses,
      savings,
      investments,
      planned,
      peak: expenses > 0 && (expenses >= planned || expenses >= savings + investments),
    };
  });
}

function getSpike(transactions: Transaction[], days: number) {
  const expenses = transactions.filter((t) => t.type === "expense" && dateWithin(t.date, days));
  const daily = new Map<string, number>();
  expenses.forEach((t) => {
    const key = t.date.slice(0, 10);
    daily.set(key, (daily.get(key) || 0) + t.amount);
  });
  if (daily.size < 7) return null;
  const values = [...daily.values()],
    average = values.reduce((a, b) => a + b, 0) / values.length,
    max = Math.max(...values);
  return max > average * 1.8
    ? `A ${peso.format(max)} spending day was ${Math.round((max / average) * 100 - 100)}% above your recent daily average.`
    : null;
}
function analyze(transactions: Transaction[], days: number) {
  const list = transactions.filter((t) => dateWithin(t.date, days));
  const expenses = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    savings = list.filter((t) => t.type === "saving").reduce((s, t) => s + t.amount, 0),
    investments = list.filter((t) => t.type === "investment").reduce((s, t) => s + t.amount, 0);
  const bucketCount = days <= 30 ? 7 : days <= 183 ? 6 : 12,
    bucketSize = days / bucketCount;
  const raw = Array.from({ length: bucketCount }, (_, i) => {
    const newest = Date.now() - (bucketCount - 1 - i) * bucketSize * 86400000,
      oldest = newest - bucketSize * 86400000;
    return {
      label: days <= 30 ? `${Math.round((bucketCount - 1 - i) * bucketSize)}d` : `P${i + 1}`,
      amount: list
        .filter(
          (t) =>
            t.type === "expense" &&
            new Date(t.date).getTime() >= oldest &&
            new Date(t.date).getTime() < newest + 86400000,
        )
        .reduce((s, t) => s + t.amount, 0),
    };
  });
  const max = Math.max(1, ...raw.map((b) => b.amount));
  const expenseDayCount = new Set(
    list.filter((item) => item.type === "expense").map((item) => item.date.slice(0, 10)),
  ).size;
  return {
    expenses,
    savings,
    investments,
    ratio: expenses ? (savings + investments) / expenses : 0,
    expenseDayCount,
    buckets: raw.map((b) => ({ ...b, percent: (b.amount / max) * 100 })),
    spike: getSpike(transactions, days),
  };
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
const encode64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
async function encryptBackup(data: FinanceData, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12)),
    key = await deriveKey(password, salt),
    encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(JSON.stringify(data)),
    );
  return {
    format: "sahod-encrypted-v1",
    salt: encode64(salt),
    iv: encode64(iv),
    ciphertext: encode64(new Uint8Array(encrypted)),
  };
}
async function decryptBackup(
  payload: { salt: string; iv: string; ciphertext: string },
  password: string,
) {
  const salt = decode64(payload.salt),
    iv = decode64(payload.iv),
    key = await deriveKey(password, salt),
    decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      decode64(payload.ciphertext),
    );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
