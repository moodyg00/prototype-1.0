/**
 * Zod validation schemas for journal entry API requests.
 *
 * Each line allows debit OR credit (not both), and the entry as a whole must
 * balance (sum of debits == sum of credits) before it can be persisted or
 * posted. We validate balance inside the create/post schemas so the service
 * layer can rely on a single canonical check.
 */
import { z } from 'zod';

import { isBalanced, sum, toDecimal } from '@/src/lib/accounting/money';

const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID.' });

/**
 * Accepts either a number or a numeric string and produces a string
 * representation. We keep amounts as strings because Prisma Decimal accepts
 * strings without precision loss; the service layer converts to Decimal as
 * needed.
 */
const amountSchema = z
  .union([z.number(), z.string()])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        ctx.addIssue({ code: 'custom', message: 'Amount must be a non-negative number.' });
        return z.NEVER;
      }
      return value.toString();
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return '0';
    if (!/^\d+(\.\d+)?$/.test(trimmed)) {
      ctx.addIssue({ code: 'custom', message: 'Amount must be numeric (digits and an optional decimal).' });
      return z.NEVER;
    }
    return trimmed;
  });

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be ISO yyyy-mm-dd.');

const journalEntryLineInputSchema = z
  .object({
    accountId: uuidSchema,
    description: z.string().trim().max(500).optional().nullable(),
    debit: amountSchema.optional().default('0'),
    credit: amountSchema.optional().default('0'),
  })
  .superRefine((line, ctx) => {
    const debit = toDecimal(line.debit);
    const credit = toDecimal(line.credit);
    if (debit.isNeg() || credit.isNeg()) {
      ctx.addIssue({ code: 'custom', message: 'Debit and credit must be non-negative.' });
    }
    if (!debit.isZero() && !credit.isZero()) {
      ctx.addIssue({ code: 'custom', message: 'A line may have a debit or a credit, but not both.' });
    }
    if (debit.isZero() && credit.isZero()) {
      ctx.addIssue({ code: 'custom', message: 'A line must have a non-zero debit or credit.' });
    }
  });

export const journalEntryCreateSchema = z
  .object({
    entryDate: dateSchema,
    description: z.string().trim().max(2000).optional().nullable(),
    reference: z.string().trim().max(120).optional().nullable(),
    sourceModule: z.string().trim().max(60).optional().nullable(),
    /**
     * Optional client preview number. The server allocates the canonical
     * value, but we accept the preview for diagnostics / future reservation.
     */
    entryNumber: z.string().trim().max(40).optional().nullable(),
    lines: z.array(journalEntryLineInputSchema).min(2, 'A journal entry needs at least two lines.'),
  })
  .superRefine((entry, ctx) => {
    const totalDebits = sum(entry.lines.map((line) => line.debit ?? '0'));
    const totalCredits = sum(entry.lines.map((line) => line.credit ?? '0'));
    if (!isBalanced(totalDebits, totalCredits)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lines'],
        message: `Journal entry is not balanced (debits ${totalDebits.toFixed(2)} vs credits ${totalCredits.toFixed(2)}).`,
      });
    }
  });

export type JournalEntryCreateInput = z.infer<typeof journalEntryCreateSchema>;
export type JournalEntryLineInput = z.infer<typeof journalEntryLineInputSchema>;

export const journalEntryUpdateSchema = z
  .object({
    entryDate: dateSchema.optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    reference: z.string().trim().max(120).optional().nullable(),
    sourceModule: z.string().trim().max(60).optional().nullable(),
    lines: z.array(journalEntryLineInputSchema).min(2).optional(),
  })
  .superRefine((entry, ctx) => {
    if (!entry.lines) return;
    const totalDebits = sum(entry.lines.map((line) => line.debit ?? '0'));
    const totalCredits = sum(entry.lines.map((line) => line.credit ?? '0'));
    if (!isBalanced(totalDebits, totalCredits)) {
      ctx.addIssue({
        code: 'custom',
        path: ['lines'],
        message: `Journal entry is not balanced (debits ${totalDebits.toFixed(2)} vs credits ${totalCredits.toFixed(2)}).`,
      });
    }
  });

export type JournalEntryUpdateInput = z.infer<typeof journalEntryUpdateSchema>;

export const journalEntryPostSchema = z.object({
  /** Currently unused, reserved for future post-time options. */
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type JournalEntryPostInput = z.infer<typeof journalEntryPostSchema>;

export const journalEntryReverseSchema = z.object({
  /** Optional override for the reversal description. */
  description: z.string().trim().max(2000).optional().nullable(),
  /** Optional override for the reversal date; defaults to today. */
  reversalDate: dateSchema.optional(),
});

export type JournalEntryReverseInput = z.infer<typeof journalEntryReverseSchema>;

const cursorSchema = z.string().min(1).optional().nullable();

export const journalEntryListQuerySchema = z.object({
  status: z.enum(['Draft', 'Posted', 'Reversed', 'all']).optional().default('all'),
  q: z.string().trim().optional().nullable(),
  cursor: cursorSchema,
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export type JournalEntryListQuery = z.infer<typeof journalEntryListQuerySchema>;

export const ledgerQuerySchema = z.object({
  from: dateSchema.optional().nullable(),
  to: dateSchema.optional().nullable(),
  accountId: uuidSchema.optional().nullable(),
  sourceModule: z.string().trim().optional().nullable(),
  status: z.enum(['Draft', 'Posted', 'Reversed', 'all']).optional().default('all'),
  q: z.string().trim().optional().nullable(),
  cursor: cursorSchema,
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;

export const accountLedgerQuerySchema = z.object({
  from: dateSchema.optional().nullable(),
  to: dateSchema.optional().nullable(),
  cursor: cursorSchema,
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

export type AccountLedgerQuery = z.infer<typeof accountLedgerQuerySchema>;
