import { getAccountingPrisma } from '../db';

/** Writes automation events to change_log without breaking the caller on failure. */
export async function logBankAutomationChange(args: {
  tableName: string;
  recordId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const prisma = getAccountingPrisma();
    await prisma.changeLog.create({
      data: {
        tableName: args.tableName,
        recordId: args.recordId,
        action: 'automation',
        userId: null,
        changes: args.changes as never,
        metadata: args.metadata as never,
        createdBy: null,
        updatedBy: null,
      },
    });
  } catch (error) {
    console.error('[banking/audit] Failed to record automation change:', error);
  }
}