import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { ensureDefaultBankRules } from '@/src/lib/banking/apply-bank-rules';
import { prisma } from '@/src/lib/prisma';

export async function GET() {
  try {
    const rules = await prisma.bankRule.findMany({
      orderBy: [{ priority: 'asc' }, { ruleName: 'asc' }],
      select: {
        id: true,
        ruleName: true,
        priority: true,
        conditions: true,
        action: true,
        isActive: true,
        appliesToProvider: true,
        appliesToAccountId: true,
        stopProcessing: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ items: rules, total: rules.length });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const ensured = await ensureDefaultBankRules();
    return NextResponse.json({ ok: true, ensured });
  } catch (error) {
    return handleRouteError(error);
  }
}
