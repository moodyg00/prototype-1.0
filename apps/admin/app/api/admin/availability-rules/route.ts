import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { availabilityRulesReplaceSchema } from '@/src/lib/validation/scheduling';

const RULE_SELECT = {
  id: true,
  subjectKind: true,
  businessId: true,
  contactId: true,
  userId: true,
  serviceId: true,
  layerKey: true,
  availabilityType: true,
  dayOfWeek: true,
  specificDate: true,
  startTime: true,
  endTime: true,
  isAvailable: true,
  isPublished: true,
  timezone: true,
  notes: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const rules = await prisma.availabilityRule.findMany({
      orderBy: [{ layerKey: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
      select: RULE_SELECT,
    });
    return NextResponse.json({ rules });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * Replace the full set of availability rules. The on-page editor owns the
 * entire published-availability set across layers, so a transactional
 * delete-all + recreate keeps the persisted state in sync with the editor.
 */
export async function PUT(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = availabilityRulesReplaceSchema.parse(body);
    const created = await prisma.$transaction(async (tx) => {
      await tx.availabilityRule.deleteMany({});
      if (parsed.rules.length === 0) return [];
      await tx.availabilityRule.createMany({
        data: parsed.rules.map((rule) => ({
          subjectKind: rule.subjectKind,
          businessId: rule.businessId ?? null,
          contactId: rule.contactId ?? null,
          userId: rule.userId ?? null,
          serviceId: rule.serviceId ?? null,
          layerKey: rule.layerKey,
          availabilityType: rule.availabilityType,
          dayOfWeek: rule.dayOfWeek ?? null,
          specificDate: rule.specificDate ? new Date(rule.specificDate) : null,
          startTime: rule.startTime ? new Date(`1970-01-01T${normalizeTime(rule.startTime)}Z`) : null,
          endTime: rule.endTime ? new Date(`1970-01-01T${normalizeTime(rule.endTime)}Z`) : null,
          isAvailable: rule.isAvailable,
          isPublished: rule.isPublished,
          timezone: rule.timezone,
          notes: rule.notes ?? null,
        })),
      });
      return tx.availabilityRule.findMany({ select: RULE_SELECT });
    });
    return NextResponse.json({ rules: created });
  } catch (error) {
    return handleRouteError(error);
  }
}

function normalizeTime(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}
