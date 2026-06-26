import 'server-only';

import { Prisma } from '@prototype/db';
import { toAmountString, toDecimal } from '@/src/lib/accounting/money';
import { prisma } from '@/src/lib/prisma';

export type CoaHierarchyNode = {
  id: string;
  code: string;
  name: string;
  type: string;
  subType: string | null;
  parentId: string | null;
};

export async function loadCoaHierarchy(): Promise<CoaHierarchyNode[]> {
  return prisma.chartOfAccount.findMany({
    select: { id: true, code: true, name: true, type: true, subType: true, parentId: true },
    orderBy: [{ code: 'asc' }],
  });
}

export function getChildAccountIdSet(
  accounts: ReadonlyArray<CoaHierarchyNode>,
): Set<string> {
  return new Set(accounts.filter((account) => account.parentId).map((account) => account.id));
}

export function filterTopLevelRows<T extends { accountId: string }>(
  rows: ReadonlyArray<T>,
  accounts: ReadonlyArray<CoaHierarchyNode>,
): T[] {
  const childIds = getChildAccountIdSet(accounts);
  return rows.filter((row) => !childIds.has(row.accountId));
}

export function buildChildrenByParent(
  accounts: ReadonlyArray<CoaHierarchyNode>,
): Map<string, string[]> {
  const childrenByParent = new Map<string, string[]>();
  for (const account of accounts) {
    if (!account.parentId) continue;
    const siblings = childrenByParent.get(account.parentId) ?? [];
    siblings.push(account.id);
    childrenByParent.set(account.parentId, siblings);
  }
  return childrenByParent;
}

export function collectDescendantIds(
  accountId: string,
  childrenByParent: ReadonlyMap<string, string[]>,
): string[] {
  const result: string[] = [];
  const queue = [...(childrenByParent.get(accountId) ?? [])];
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) continue;
    result.push(next);
    queue.push(...(childrenByParent.get(next) ?? []));
  }
  return result;
}

type NumericTotals = {
  debit: Prisma.Decimal;
  credit: Prisma.Decimal;
};

export function rollupNumericTotals(
  directByAccount: ReadonlyMap<string, NumericTotals>,
  accounts: ReadonlyArray<CoaHierarchyNode>,
): Map<string, NumericTotals> {
  const childrenByParent = buildChildrenByParent(accounts);
  const rolled = new Map<string, NumericTotals>();

  for (const account of accounts) {
    const direct = directByAccount.get(account.id) ?? {
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(0),
    };
    rolled.set(account.id, { debit: direct.debit, credit: direct.credit });
  }

  const parents = accounts
    .filter((account) => (childrenByParent.get(account.id)?.length ?? 0) > 0)
    .sort((a, b) => b.code.length - a.code.length);

  for (const parent of parents) {
    const parentTotals = rolled.get(parent.id)!;
    for (const childId of collectDescendantIds(parent.id, childrenByParent)) {
      const childTotals = rolled.get(childId);
      if (!childTotals) continue;
      parentTotals.debit = parentTotals.debit.add(childTotals.debit);
      parentTotals.credit = parentTotals.credit.add(childTotals.credit);
    }
  }

  return rolled;
}

export type ChildAccountBalance = {
  id: string;
  code: string;
  name: string;
  balance: string;
};

export async function listChildAccountBalances(
  parentId: string,
): Promise<ChildAccountBalance[]> {
  const children = await prisma.chartOfAccount.findMany({
    where: { parentId, isActive: true },
    select: { id: true, code: true, name: true, type: true },
    orderBy: [{ code: 'asc' }],
  });
  if (children.length === 0) return [];

  const grouped = await prisma.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      accountId: { in: children.map((child) => child.id) },
      journalEntry: { is: { status: { in: ['Posted', 'Reversed'] } } },
    },
    _sum: { debit: true, credit: true },
  });

  const totalsByAccount = new Map(
    grouped.map((row) => [
      row.accountId,
      {
        debit: row._sum.debit ?? new Prisma.Decimal(0),
        credit: row._sum.credit ?? new Prisma.Decimal(0),
      },
    ]),
  );

  return children.map((child) => {
    const totals = totalsByAccount.get(child.id) ?? {
      debit: new Prisma.Decimal(0),
      credit: new Prisma.Decimal(0),
    };
    const balance =
      child.type === 'asset' || child.type === 'expense'
        ? toDecimal(totals.debit).sub(toDecimal(totals.credit))
        : toDecimal(totals.credit).sub(toDecimal(totals.debit));
    return {
      id: child.id,
      code: child.code,
      name: child.name,
      balance: toAmountString(balance),
    };
  });
}
