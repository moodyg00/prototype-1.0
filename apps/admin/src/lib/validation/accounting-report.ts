import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be ISO yyyy-mm-dd.');

export const REPORT_TYPES = [
  'trial-balance',
  'profit-loss',
  'balance-sheet',
  'general-ledger',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_FORMATS = ['pdf', 'markdown', 'csv'] as const;

export type ReportFormat = (typeof REPORT_FORMATS)[number];

export const accountingReportGenerateSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES),
    from: dateSchema,
    to: dateSchema,
    format: z.enum(REPORT_FORMATS),
  })
  .superRefine((value, ctx) => {
    if (value.from > value.to) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start date must be on or before end date.',
        path: ['from'],
      });
    }
  });

export type AccountingReportGenerateInput = z.infer<typeof accountingReportGenerateSchema>;
