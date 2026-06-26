/**
 * Validation schemas for invoice and estimate billing documents.
 *
 * Both kinds share a line-item shape and a discount/tax model. We expose two
 * families of schemas:
 *   - `*CreateInputSchema`: payload for POST /api/admin/{kind}
 *   - `*UpdateInputSchema`: payload for PATCH /api/admin/{kind}/[id]
 *
 * Amount strings are validated with `decimalString` (digits with optional
 * 2-dp tail) so they can flow into Prisma.Decimal without precision loss.
 */
import { z } from 'zod';

const uuid = z.string().uuid({ message: 'Must be a valid UUID.' });

/** Form payloads may send "" for cleared pickers; treat as null before UUID check. */
const optionalNullableUuid = z.preprocess(
  (value) => (value === '' ? null : value),
  uuid.nullable().optional(),
);

/**
 * Decimal string for currency or quantity. Allows empty / "0" defaults so
 * the editor can hold a transient blank value before the user types.
 */
export const decimalString = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0) {
        ctx.addIssue({ code: 'custom', message: 'Must be a non-negative number.' });
        return z.NEVER;
      }
      return value.toString();
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return '0';
    if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Must be a numeric string (digits with up to 4 decimals).',
      });
      return z.NEVER;
    }
    return trimmed;
  });

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be ISO yyyy-mm-dd.');

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

const discountTypeSchema = z
  .enum(['amount', 'percent'])
  .nullable()
  .optional();

/**
 * Single line item shared between Invoice and Estimate. `kind` distinguishes
 * catalog references — see `line-item-kinds.ts`. `description` may stand
 * alone (free-form line) when kind is `custom`.
 */
export const lineItemSchema = z.object({
  kind: z.enum(['service', 'product', 'material', 'custom']).default('custom'),
  serviceId: optionalNullableUuid,
  productId: optionalNullableUuid,
  description: z.string().trim().max(500).optional().nullable(),
  quantity: decimalString.default('1'),
  unitPrice: decimalString.default('0'),
  notes: z.string().trim().max(2000).optional().nullable(),
  /** When false, line stays on the document but is excluded from customer totals. */
  isBillable: z.boolean().optional().default(true),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

const baseDocumentFields = {
  contactId: optionalNullableUuid,
  contactName: optionalString(255),
  organizationId: optionalNullableUuid,
  organizationName: optionalString(255),
  notes: optionalString(2000),
  paymentTerms: optionalString(255),
  discountType: discountTypeSchema,
  discountValue: decimalString.optional().default('0'),
  /** Document-level tax % (v1 simplification). */
  taxRate: decimalString.optional().default('0'),
  /** Internal notes / metadata payload. */
  internalNotes: optionalString(2000),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
};

/* ------------------------------------------------------------------------- *
 * Invoice                                                                   *
 * ------------------------------------------------------------------------- */

export const invoiceCreateInputSchema = z.object({
  ...baseDocumentFields,
  issueDate: isoDate,
  dueDate: isoDate,
  status: z.enum(['draft']).default('draft'),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateInputSchema>;

export const invoiceUpdateInputSchema = invoiceCreateInputSchema.partial().extend({
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateInputSchema>;

/* ------------------------------------------------------------------------- *
 * Estimate                                                                  *
 * ------------------------------------------------------------------------- */

export const estimateCreateInputSchema = z.object({
  ...baseDocumentFields,
  title: z.string().trim().min(1, 'Title is required.').max(255),
  issueDate: isoDate,
  validUntil: isoDate.optional().nullable(),
  estimateTemplateId: optionalNullableUuid,
  status: z.enum(['draft']).default('draft'),
});

export type EstimateCreateInput = z.infer<typeof estimateCreateInputSchema>;

export const estimateUpdateInputSchema = estimateCreateInputSchema.partial().extend({
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export type EstimateUpdateInput = z.infer<typeof estimateUpdateInputSchema>;

/* ------------------------------------------------------------------------- *
 * GET query schemas                                                         *
 * ------------------------------------------------------------------------- */

export const billingPickerQuerySchema = z.object({
  q: z.string().trim().optional().nullable(),
  organizationId: optionalNullableUuid,
  active: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      if (!value) return undefined;
      return value === '1' || value.toLowerCase() === 'true';
    }),
});

export type BillingPickerQuery = z.infer<typeof billingPickerQuerySchema>;
