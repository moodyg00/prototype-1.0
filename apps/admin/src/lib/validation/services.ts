import { z } from 'zod';

export const SERVICE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'landscaping',
  'cleaning',
  'general',
  'other',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const serviceUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  description: z.string().trim().optional().nullable(),
  quotePrompt: z.string().trim().optional().nullable(),
  category: z.enum(SERVICE_CATEGORIES).optional(),
  estimatedDurationMinutes: z
    .union([z.number().int().nonnegative(), z.string().trim()])
    .optional()
    .nullable()
    .transform((value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }),
  suggestedPrice: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
