import type { ParentCategory, Account, Transaction, FinanceData } from '@/src/types/finance';
import { parents, seedData, uid, accountName } from '@/src/lib/finance';

export function migrate(raw: unknown): FinanceData {
  if (!raw || typeof raw !== 'object') return seedData;
  const old = raw as Omit<Partial<FinanceData>, 'version'> & { version?: number; categories?: string[] };
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
      accounts: old.accounts.filter((account) => !account.archived),
      emergencyAccountIds: (Array.isArray(old.emergencyAccountIds) ? old.emergencyAccountIds : [])
        .filter((id, index, ids) => ids.indexOf(id) === index && old.accounts!.some((account) => account.id === id && !account.archived)),
    } as FinanceData;
  const legacyAccounts = (old.accounts || []).map(
    (item: Account & { name?: string }) => ({
      id: item.id || uid(),
      provider: item.provider || item.name || 'Account',
      nickname: item.nickname || '',
      type: item.type || 'E-wallet',
      balance: Number(item.balance) || 0,
      archived: false,
    }),
  );
  const categoryNames = old.categories?.length ? old.categories : parents;
  const subcategories = categoryNames.map((name) => ({
    id: `legacy-${name.toLowerCase().replace(/\W+/g, '-')}`,
    parent: (parents.includes(name as ParentCategory)
      ? name
      : 'Other') as ParentCategory,
    name,
    plannedAmount: 0,
    archived: false,
  }));
  const transactions = (old.transactions || []).map(
    (item: Transaction & { category?: string; account?: string }) => {
      const label = item.label || item.category || 'Other';
      const sub = subcategories.find((s) => s.name === label);
      const account = legacyAccounts.find(
        (a) => a.provider === item.account || accountName(a) === item.account,
      );
      return {
        ...item,
        id: item.id || uid(),
        parent: item.type === 'income' ? 'Income' : sub?.parent || 'Other',
        subcategoryId: sub?.id,
        label,
        accountId: item.accountId || account?.id,
        accountLabel: item.accountLabel || item.account || 'Archived account',
      } as Transaction;
    },
  );
  return {
    version: 4,
    salary: Number(old.salary) || 0,
    nextPayday: old.nextPayday || seedData.nextPayday,
    emergencyTarget: Number(old.emergencyTarget) || 0,
    emergencyAccountIds: [],
    plan: seedData.plan,
    accounts: legacyAccounts.length ? legacyAccounts : seedData.accounts,
    subcategories,
    transactions,
    adjustments: [],
  };
}

export function loadData() {
  try {
    return migrate(JSON.parse(localStorage.getItem('sahod-data') || ''));
  } catch {
    return seedData;
  }
}
