import type { Period, Transaction, FinanceData } from '@/src/types/finance';
import { expenseBudget } from '@/src/lib/balance-summary';
import { peso, dateWithin } from '@/src/lib/finance';

export function activitySeries(data: FinanceData, period: Period) {
  if (period === '1y') return annualActivity(data);
  const monthlyExpenseLimit = expenseBudget(data);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const ranges: { start: Date; end: Date; label: string; planned: number }[] =
    [];

  if (period === '7d') {
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = new Date(today);
      start.setDate(today.getDate() - offset);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      ranges.push({
        start,
        end,
        label: new Intl.DateTimeFormat('en', {
          weekday: 'short',
          day: 'numeric',
        }).format(start),
        planned: monthlyExpenseLimit / 30,
      });
    }
  } else if (period === '30d') {
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
        label: `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start)}–${new Intl.DateTimeFormat('en', { day: 'numeric' }).format(end)}`,
        planned: monthlyExpenseLimit / 6,
      });
    }
  } else {
    for (let offset = 5; offset >= 0; offset -= 1) {
      const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      ranges.push({
        start,
        end,
        label: new Intl.DateTimeFormat('en', { month: 'short' }).format(start),
        planned: monthlyExpenseLimit,
      });
    }
  }

  return ranges.map((range) =>
    summarizeActivityRange(data.transactions, range),
  );
}

export function summarizeActivityRange(
  transactions: Transaction[],
  range: { start: Date; end: Date; label: string; planned: number },
) {
  const records = transactions.filter((transaction) => {
    const timestamp = new Date(transaction.date).getTime();
    return (
      timestamp >= range.start.getTime() && timestamp <= range.end.getTime()
    );
  });
  const expenses = records
    .filter((record) => record.type === 'expense')
    .reduce((sum, record) => sum + record.amount, 0);
  const savings = records
    .filter((record) => record.type === 'saving')
    .reduce((sum, record) => sum + record.amount, 0);
  const investments = records
    .filter((record) => record.type === 'investment')
    .reduce((sum, record) => sum + record.amount, 0);
  const dailyExpenses = new Map<string, number>();
  records
    .filter((record) => record.type === 'expense')
    .forEach((record) => {
      const key = record.date.slice(0, 10);
      dailyExpenses.set(key, (dailyExpenses.get(key) || 0) + record.amount);
    });
  const peakDate = [...dailyExpenses.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const exactDate = peakDate
    ? new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(`${peakDate}T12:00:00`))
    : `${new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(range.start)} – ${new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(range.end)}`;
  return {
    month: range.label,
    dateLabel: exactDate,
    shortDate: peakDate
      ? new Intl.DateTimeFormat('en', {
          month: 'short',
          day: 'numeric',
        }).format(new Date(`${peakDate}T12:00:00`))
      : '',
    expenses,
    savings,
    investments,
    planned: range.planned,
    peak:
      expenses > 0 &&
      (range.planned > 0 && expenses >= range.planned),
  };
}

export function annualActivity(data: FinanceData) {
  const year = new Date().getFullYear();
  const planned = expenseBudget(data);
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const monthTransactions = data.transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    });
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const savings = monthTransactions
      .filter((t) => t.type === 'saving')
      .reduce((sum, t) => sum + t.amount, 0);
    const investments = monthTransactions
      .filter((t) => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);
    const dailyExpenses = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((transaction) => {
        const dateKey = transaction.date.slice(0, 10);
        dailyExpenses.set(
          dateKey,
          (dailyExpenses.get(dateKey) || 0) + transaction.amount,
        );
      });
    const peakExpenseDate = [...dailyExpenses.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const latestActivityDate = [...monthTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0]?.date;
    const displayDate = peakExpenseDate || latestActivityDate;
    return {
      month: new Intl.DateTimeFormat('en', { month: 'short' }).format(
        new Date(year, monthIndex, 1),
      ),
      dateLabel: displayDate
        ? new Intl.DateTimeFormat('en', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date(`${displayDate.slice(0, 10)}T12:00:00`))
        : new Intl.DateTimeFormat('en', {
            month: 'long',
            year: 'numeric',
          }).format(new Date(year, monthIndex, 1)),
      shortDate: peakExpenseDate
        ? new Intl.DateTimeFormat('en', {
            month: 'short',
            day: 'numeric',
          }).format(new Date(`${peakExpenseDate}T12:00:00`))
        : '',
      expenses,
      savings,
      investments,
      planned,
      peak:
        expenses > 0 &&
        (planned > 0 && expenses >= planned),
    };
  });
}

export function getSpike(transactions: Transaction[], days: number) {
  const expenses = transactions.filter(
    (t) => t.type === 'expense' && dateWithin(t.date, days),
  );
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

export function getLoggingStreak(transactions: Transaction[]) {
  const days = new Set(
    transactions
      .filter((transaction) => transaction.type === 'expense')
      .map((transaction) => transaction.date.slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function analyze(transactions: Transaction[], days: number) {
  const list = transactions.filter((t) => dateWithin(t.date, days));
  const expenses = list
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0),
    savings = list
      .filter((t) => t.type === 'saving')
      .reduce((s, t) => s + t.amount, 0),
    investments = list
      .filter((t) => t.type === 'investment')
      .reduce((s, t) => s + t.amount, 0);
  const bucketCount = days <= 30 ? 7 : days <= 183 ? 6 : 12,
    bucketSize = days / bucketCount;
  const raw = Array.from({ length: bucketCount }, (_, i) => {
    const newest = Date.now() - (bucketCount - 1 - i) * bucketSize * 86400000,
      oldest = newest - bucketSize * 86400000;
    return {
      label:
        days <= 30
          ? `${Math.round((bucketCount - 1 - i) * bucketSize)}d`
          : `P${i + 1}`,
      amount: list
        .filter(
          (t) =>
            t.type === 'expense' &&
            new Date(t.date).getTime() >= oldest &&
            new Date(t.date).getTime() < newest + 86400000,
        )
        .reduce((s, t) => s + t.amount, 0),
    };
  });
  const max = Math.max(1, ...raw.map((b) => b.amount));
  const expenseDayCount = new Set(
    list
      .filter((item) => item.type === 'expense')
      .map((item) => item.date.slice(0, 10)),
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
