import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Load the actual extracted TypeScript services without creating build artifacts.
const moduleUrls = new Map();
async function financeModuleUrl(path) {
  if (moduleUrls.has(path)) return moduleUrls.get(path);
  const source = await readFile(new URL(`../${path}.ts`, import.meta.url), 'utf8');
  let code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const match of [...code.matchAll(/from ['"](@\/src\/[^'"]+)['"]/g)]) {
    const url = await financeModuleUrl(match[1].replace('@/', ''));
    code = code.replaceAll(match[1], url);
  }
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  moduleUrls.set(path, url);
  return url;
}

test('extracted storage preserves existing records and empty production defaults', async () => {
  const { migrate } = await import(await financeModuleUrl('src/services/local-storage'));
  const empty = migrate(null);
  assert.equal(empty.salary, 0);
  assert.deepEqual(empty.accounts, []);
  assert.deepEqual(empty.transactions, []);
  const existing = { ...fixture(), version: 4, nextPayday: '2026-09-15' };
  assert.deepEqual(migrate(JSON.parse(JSON.stringify(existing))), existing);
});

test('extracted analytics ignore corrections and preserve allocation independence', async () => {
  const { analyze, activitySeries } = await import(await financeModuleUrl('src/features/analytics/calculations'));
  const date = new Date().toISOString();
  const data = { ...fixture(), transactions: [
    { id: 'expense', date, type: 'expense', amount: 100 },
    { id: 'saving', date, type: 'saving', amount: 25 },
    { id: 'investment', date, type: 'investment', amount: 10 },
    { id: 'correction', date, type: 'value_adjustment', amount: 9000 },
  ] };
  const actual = analyze(data.transactions, 30);
  assert.equal(actual.expenses, 100);
  assert.equal(actual.savings, 25);
  assert.equal(actual.investments, 10);
  assert.equal(actual.ratio, 0.35);
  const before = activitySeries(data, '30d');
  data.subcategories = [];
  const after = activitySeries(data, '30d');
  assert.deepEqual(after.map(({ planned, peak, ...point }) => point), before.map(({ planned, peak, ...point }) => point));
  assert.ok(after.every((point) => point.planned === 0 && !point.peak));
});

test('extracted backup service encrypts and restores real finance data', async () => {
  const { encryptBackup, decryptBackup } = await import(await financeModuleUrl('src/services/backup'));
  const data = { ...fixture(), version: 4 };
  const encrypted = await encryptBackup(data, 'test-password-only');
  assert.deepEqual(await decryptBackup(encrypted, 'test-password-only'), data);
  await assert.rejects(() => decryptBackup(encrypted, 'wrong-password'));
});

const SEPTEMBER_3 = new Date('2026-09-03T12:00:00+08:00');

test('real summary keeps salary shortfall separate from already-debited balances', async () => {
  const { summarizeFinance } = await import(await financeModuleUrl('src/lib/balance-summary'));
  const data = { ...fixture(), nextPayday: '2026-09-15', accounts: [
    { id: 'wallet', balance: 5000 }, { id: 'reserve', balance: 2000 },
  ], emergencyAccountIds: ['reserve'], transactions: [
    { type: 'expense', amount: 13000, date: '2026-09-02T00:00:00Z' },
    { type: 'saving', amount: 500, date: '2026-09-02T00:00:00Z' },
    { type: 'investment', amount: 300, date: '2026-09-02T00:00:00Z' },
    { type: 'expense', amount: 99999, date: '2026-10-02T00:00:00Z' },
  ] };
  const result = summarizeFinance(data, SEPTEMBER_3);
  assert.equal(result.liquid, 7000);
  assert.equal(result.availableBalance, 5000);
  assert.equal(result.emergencyBalance, 2000);
  assert.equal(result.salaryShortfall, 1000);
  assert.equal(result.projected, -1000);
  assert.equal(result.savings, 500);
  assert.equal(result.investments, 300);
  assert.equal(summarizeFinance({ ...data, emergencyTarget: 999999 }, SEPTEMBER_3).availableBalance, 5000);
});

test('permanent account deletion changes balances without deleting or reversing history', async () => {
  const { deleteAccount, summarizeFinance } = await import(await financeModuleUrl('src/lib/balance-summary'));
  const data = { ...fixture(), nextPayday: '2026-09-15', emergencyAccountIds: ['gcash'],
    adjustments: [{ id: 'correction', accountId: 'gcash', amount: 100, reason: 'Balance check' }] };
  const next = deleteAccount(data, 'gcash');
  assert.deepEqual(next.accounts, []);
  assert.deepEqual(next.emergencyAccountIds, []);
  assert.deepEqual(next.transactions, data.transactions);
  assert.deepEqual(next.adjustments, data.adjustments);
  const result = summarizeFinance(next, SEPTEMBER_3);
  assert.equal(result.liquid, 0);
  assert.equal(result.emergencyBalance, 0);
  assert.equal(result.expenses, 185);
  assert.equal(result.savings, 500);
  assert.equal(result.projected, 11815);
  assert.equal(data.accounts.length, 1);
});

test('budget warnings use expense allocations and exact thresholds independently of salary', async () => {
  const { summarizeFinance } = await import(await financeModuleUrl('src/lib/balance-summary'));
  const data = { ...fixture(), nextPayday: '2026-09-15', subcategories: [
    { parent: 'Food', plannedAmount: 1000 },
    { parent: 'Savings', plannedAmount: 9000 },
    { parent: 'Investments', plannedAmount: 8000 },
    { parent: 'Bills', plannedAmount: 1000, archived: true },
  ] };
  for (const [amount, expected] of [[799.99, 'within'], [800, 'approaching'], [1000, 'approaching'], [1000.01, 'over']]) {
    const result = summarizeFinance({ ...data, transactions: [{ type: 'expense', amount, date: '2026-09-02T00:00:00Z' }] }, SEPTEMBER_3);
    assert.equal(result.expenseBudget, 1000);
    assert.equal(result.budgetStatus, expected);
    assert.equal(result.salaryShortfall, 0);
  }
  const unset = summarizeFinance({ ...data, salary: 0, subcategories: [], transactions: [{ type: 'expense', amount: 200, date: '2026-09-02T00:00:00Z' }] }, SEPTEMBER_3);
  assert.equal(unset.budgetStatus, 'unset');
  assert.equal(unset.salaryShortfall, 200);
});

test('emergency balances handle duplicate selections, removed accounts and overdrafts', async () => {
  const { accountTotals } = await import(await financeModuleUrl('src/lib/balance-summary'));
  const result = accountTotals({ ...fixture(), accounts: [
    { id: 'a', balance: 100.10 }, { id: 'b', balance: -20.20 }, { id: 'old', balance: 9000, archived: true },
  ], emergencyAccountIds: ['a', 'a', 'b', 'old', 'missing'] });
  assert.deepEqual(result, { liquid: 79.9, emergencyBalance: 100.1, availableBalance: -20.2 });
});

test('migration finalizes removed accounts while preserving history and valid emergency selections', async () => {
  const { migrate } = await import(await financeModuleUrl('src/services/local-storage'));
  const data = { ...fixture(), version: 4, accounts: [...fixture().accounts, { id: 'old', balance: 500, archived: true }],
    emergencyAccountIds: ['gcash', 'gcash', 'old', 'missing'], adjustments: [{ id: 'old-correction', accountId: 'old', amount: 5 }] };
  const result = migrate(data);
  assert.equal(result.accounts.length, 1);
  assert.deepEqual(result.emergencyAccountIds, ['gcash']);
  assert.deepEqual(result.transactions, data.transactions);
  assert.deepEqual(result.adjustments, data.adjustments);
  const legacy = { ...data, emergencyAccountIds: undefined };
  assert.deepEqual(migrate(legacy).emergencyAccountIds, []);
});

function isCurrentMonth(isoDate, now = SEPTEMBER_3) {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function summarize(data, now = SEPTEMBER_3) {
  const current = data.transactions.filter((item) =>
    isCurrentMonth(item.date, now),
  );
  const total = (type) =>
    current
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + item.amount, 0);
  const expenses = total('expense');
  return {
    expenses,
    savings: total('saving'),
    investments: total('investment'),
    projected: data.salary - expenses,
    liquid: data.accounts
      .filter((account) => !account.archived)
      .reduce((sum, account) => sum + account.balance, 0),
  };
}

function allocationTotals(data) {
  const active = data.subcategories.filter((item) => !item.archived);
  return {
    total: active.reduce((sum, item) => sum + item.plannedAmount, 0),
    byParent: Object.fromEntries(
      [...new Set(active.map((item) => item.parent))].map((parent) => [
        parent,
        active
          .filter((item) => item.parent === parent)
          .reduce((sum, item) => sum + item.plannedAmount, 0),
      ]),
    ),
  };
}

function addExpense(data, entry) {
  return {
    ...data,
    accounts: data.accounts.map((account) =>
      account.id === entry.accountId
        ? { ...account, balance: account.balance - entry.amount }
        : account,
    ),
    transactions: [entry, ...data.transactions],
  };
}

function removeTransaction(data, id) {
  const removed = data.transactions.find((item) => item.id === id);
  return {
    ...data,
    accounts: data.accounts.map((account) =>
      account.id === removed?.accountId && removed.type === 'expense'
        ? { ...account, balance: account.balance + removed.amount }
        : account,
    ),
    transactions: data.transactions.filter((item) => item.id !== id),
  };
}

function zeroEverything(data) {
  return {
    ...data,
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
  };
}

function fixture() {
  return {
    salary: 12000,
    emergencyTarget: 24000,
    emergencyAccountIds: [],
    plan: {
      minSavingsPercent: 10,
      maxSavingsPercent: 20,
      maxInvestmentPercent: 10,
    },
    accounts: [
      { id: 'gcash', type: 'E-wallet', balance: 9000, archived: false },
    ],
    subcategories: [
      {
        id: 'groceries',
        parent: 'Food',
        plannedAmount: 2500,
        archived: false,
      },
      {
        id: 'water',
        parent: 'Bills',
        plannedAmount: 500,
        archived: false,
      },
      {
        id: 'old-loan',
        parent: 'Bills',
        plannedAmount: 1000,
        archived: true,
      },
    ],
    transactions: [
      {
        id: 'sep-food',
        type: 'expense',
        amount: 185,
        accountId: 'gcash',
        date: '2026-09-01T08:00:00+08:00',
      },
      {
        id: 'aug-food',
        type: 'expense',
        amount: 499,
        accountId: 'gcash',
        date: '2026-08-30T08:00:00+08:00',
      },
      {
        id: 'saving',
        type: 'saving',
        amount: 500,
        accountId: 'gcash',
        date: '2026-09-02T08:00:00+08:00',
      },
      {
        id: 'investment',
        type: 'investment',
        amount: 300,
        accountId: 'gcash',
        date: '2026-09-02T09:00:00+08:00',
      },
    ],
    adjustments: [],
  };
}

test('salary projection subtracts current-month expense entries only', () => {
  const summary = summarize(fixture());
  assert.equal(summary.expenses, 185);
  assert.equal(summary.savings, 500);
  assert.equal(summary.investments, 300);
  assert.equal(summary.projected, 11815);
});

test('allocations do not alter the salary-based projection', () => {
  const data = fixture();
  const before = summarize(data).projected;
  data.subcategories[0].plannedAmount = 9000;
  data.subcategories.push({
    id: 'rent',
    parent: 'Bills',
    plannedAmount: 4000,
    archived: false,
  });
  assert.equal(summarize(data).projected, before);
});

test('dashboard allocation totals exclude archived subcategories', () => {
  const allocations = allocationTotals(fixture());
  assert.equal(allocations.total, 3000);
  assert.equal(allocations.byParent.Food, 2500);
  assert.equal(allocations.byParent.Bills, 500);
});

test('daily expense stays consistent across account, dashboard, activity, and plan', () => {
  const entry = {
    id: 'daily-expense',
    type: 'expense',
    amount: 321,
    accountId: 'gcash',
    date: '2026-09-03T10:00:00+08:00',
  };
  const updated = addExpense(fixture(), entry);
  const dashboard = summarize(updated);
  const plan = summarize(updated);
  const activityAmount = updated.transactions.find(
    (item) => item.id === entry.id,
  )?.amount;

  assert.equal(activityAmount, 321);
  assert.equal(updated.accounts[0].balance, 8679);
  assert.equal(dashboard.expenses, 506);
  assert.equal(plan.expenses, dashboard.expenses);
  assert.equal(plan.projected, 11494);
});

test('deleting an expense reverses its account and projection effects', () => {
  const entry = {
    id: 'daily-expense',
    type: 'expense',
    amount: 321,
    accountId: 'gcash',
    date: '2026-09-03T10:00:00+08:00',
  };
  const restored = removeTransaction(addExpense(fixture(), entry), entry.id);
  assert.equal(restored.accounts[0].balance, 9000);
  assert.equal(summarize(restored).expenses, 185);
  assert.equal(summarize(restored).projected, 11815);
});

test('local JSON round-trip preserves finance records', () => {
  const data = addExpense(fixture(), {
    id: 'persisted',
    type: 'expense',
    amount: 321,
    accountId: 'gcash',
    date: '2026-09-03T10:00:00+08:00',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
});

test('zero-everything contract removes current finance data', () => {
  const reset = zeroEverything(fixture());
  assert.equal(reset.salary, 0);
  assert.equal(reset.emergencyTarget, 0);
  assert.deepEqual(reset.accounts, []);
  assert.deepEqual(reset.subcategories, []);
  assert.deepEqual(reset.transactions, []);
  assert.deepEqual(reset.adjustments, []);
  assert.deepEqual(reset.plan, {
    minSavingsPercent: 0,
    maxSavingsPercent: 0,
    maxInvestmentPercent: 0,
  });
});

test('activity category determines expense, saving, or investment type', () => {
  const classify = (category) =>
    category === 'Savings'
      ? 'saving'
      : category === 'Investments'
        ? 'investment'
        : 'expense';
  assert.equal(classify('Food'), 'expense');
  assert.equal(classify('Bills'), 'expense');
  assert.equal(classify('Savings'), 'saving');
  assert.equal(classify('Investments'), 'investment');
});

test('source wiring keeps projection and logging placement aligned', async () => {
  const modules = [
    'app/finance-tracker.tsx',
    'features/dashboard/dashboard.tsx',
    'features/activity/activity.tsx',
    'features/activity/add-dialog.tsx',
    'features/plans/plan.tsx',
    'features/analytics/calculations.ts',
    'lib/balance-summary.ts',
    'components/balance-overview.tsx',
  ];
  const source = (await Promise.all(modules.map((path) =>
    readFile(new URL(`../src/${path}`, import.meta.url), 'utf8'),
  ))).join('\n');
  assert.match(source, /const projected = money\(data\.salary - expenses\);/);
  assert.match(source, /onLogExpense=\{\(\) => setAddOpen\(true\)\}/);
  assert.match(source, />Log activity</);
  assert.match(source, /<CardTitle>Monthly allocations<\/CardTitle>/);
  assert.match(source, /if \(daily\.size < 7\) return null;/);
  assert.match(source, /Log expenses for at least 7 days/);
  assert.match(source, /Classified as/);
  assert.doesNotMatch(source, /Account type/);
  assert.doesNotMatch(source, /<DialogTitle>Log daily expense<\/DialogTitle>/);
  assert.doesNotMatch(source, /onAddEntry=\{\(\) => setAddOpen\(true\)\}/);
  assert.match(
    source,
    /the shortfall is not deducted again\./,
  );
});
