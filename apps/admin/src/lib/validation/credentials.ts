import { z } from 'zod';

export const credentialCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  siteUrl: z.union([z.string().url(), z.literal('')]).optional(),
  username: z.string().trim().min(1).max(255),
  password: z.string().min(1),
  notes: z.string().trim().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const credentialUpdateSchema = credentialCreateSchema.partial();
