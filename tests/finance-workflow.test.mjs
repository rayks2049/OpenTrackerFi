import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const SEPTEMBER_3 = new Date('2026-09-03T12:00:00+08:00');

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
  const source = await readFile(
    new URL('../app/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /const projected = data\.salary - expenses;/);
  assert.match(source, /onLogExpense=\{\(\) => setAddOpen\(true\)\}/);
  assert.match(source, />Log activity</);
  assert.match(source, /<CardTitle>Monthly allocations<\/CardTitle>/);
  assert.match(source, /if \(daily\.size < 7\) return null;/);
  assert.match(source, /Limited data/);
  assert.match(source, /Classified as/);
  assert.doesNotMatch(source, /Account type/);
  assert.doesNotMatch(source, /<DialogTitle>Log daily expense<\/DialogTitle>/);
  assert.doesNotMatch(source, /onAddEntry=\{\(\) => setAddOpen\(true\)\}/);
  assert.match(
    source,
    /Monthly salary minus expense entries logged during the\s+current\s+month\. Monthly allocations are excluded\./,
  );
});
