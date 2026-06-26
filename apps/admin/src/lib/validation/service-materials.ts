import { z } from 'zod';

export const serviceMaterialRowSchema = z.object({
  id: z.string().uuid().optional(),
  productId: z.string().uuid(),
  defaultQuantity: z.string().trim().min(1, 'Quantity is required.'),
  isOptional: z.boolean().default(false),
  notes: z.string().trim().optional().nullable(),
});

export const serviceMaterialsReplaceSchema = z.object({
  materials: z.array(serviceMaterialRowSchema),
});

export type ServiceMaterialRowInput = z.infer<typeof serviceMaterialRowSchema>;
