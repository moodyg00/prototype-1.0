import { z } from 'zod';

export const PRODUCT_CATEGORIES = [
  'tools',
  'materials',
  'consumables',
  'equipment',
  'safety_gear',
  'digital_product',
  'physical_product',
  'refurbished_product',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    return value;
  })
  .refine((value) => value === null || /^https?:\/\//i.test(value), {
    message: 'URL must start with http:// or https://',
  });

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  description: z.string().trim().optional().nullable(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  sku: z.string().trim().optional().nullable(),
  unitOfMeasure: z.string().trim().optional().nullable(),
  unitPrice: z.string().trim().optional().nullable(),
  purchaseUrl: optionalUrl,
  isForSale: z.boolean().optional(),
  isInternalUse: z.boolean().optional(),
});

export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
