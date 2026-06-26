import { prisma } from '@/src/lib/prisma';
import { writeAuditEntry } from '@/src/lib/change-log';
import { z } from 'zod';

export const primaryBusinessPatchSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  legalName: z.string().trim().max(255).nullable().optional(),
  ein: z.string().trim().max(40).nullable().optional(),
  email: z
    .string()
    .trim()
    .max(255)
    .nullable()
    .optional()
    .refine((value) => value === undefined || value === null || value === '' || z.string().email().safeParse(value).success, {
      message: 'Must be a valid email address.',
    }),
  phone: z.string().trim().max(40).nullable().optional(),
  website: z.string().trim().max(255).nullable().optional(),
  addressLine1: z.string().trim().max(255).nullable().optional(),
  addressLine2: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  state: z.string().trim().max(80).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  primaryColor: z.string().trim().max(20).nullable().optional(),
  accentColor: z.string().trim().max(20).nullable().optional(),
  defaultPaymentTerms: z.string().nullable().optional(),
  documentIntroText: z.string().nullable().optional(),
  documentFooterText: z.string().nullable().optional(),
});

export type PrimaryBusinessDto = {
  id: string;
  name: string;
  legalName: string | null;
  ein: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  defaultPaymentTerms: string | null;
  documentIntroText: string | null;
  documentFooterText: string | null;
  isPrimary: boolean;
};

function serializeBusiness(row: {
  id: string;
  name: string;
  legalName: string | null;
  ein: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  defaultPaymentTerms: string | null;
  documentIntroText: string | null;
  documentFooterText: string | null;
  isPrimary: boolean;
}): PrimaryBusinessDto {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName,
    ein: row.ein,
    email: row.email,
    phone: row.phone,
    website: row.website,
    addressLine1: row.addressLine1,
    addressLine2: row.addressLine2,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    primaryColor: row.primaryColor,
    accentColor: row.accentColor,
    defaultPaymentTerms: row.defaultPaymentTerms,
    documentIntroText: row.documentIntroText,
    documentFooterText: row.documentFooterText,
    isPrimary: row.isPrimary,
  };
}

export async function getOrCreatePrimaryBusiness(userId?: string | null): Promise<PrimaryBusinessDto> {
  let row = await prisma.business.findFirst({
    where: { isPrimary: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!row) {
    row = await prisma.business.create({
      data: {
        name: 'My Business',
        country: 'US',
        isPrimary: true,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      },
    });

    await writeAuditEntry({
      tableName: 'businesses',
      recordId: row.id,
      action: 'create',
      userId,
      changes: { new: { name: row.name, isPrimary: true } },
    });
  }

  return serializeBusiness(row);
}

export async function updatePrimaryBusiness(
  input: unknown,
  userId?: string | null,
): Promise<PrimaryBusinessDto> {
  const parsed = primaryBusinessPatchSchema.parse(input);
  const existing = await getOrCreatePrimaryBusiness(userId);

  const data = {
    ...parsed,
    email: parsed.email === '' ? null : parsed.email,
    updatedBy: userId ?? null,
  };

  const row = await prisma.business.update({
    where: { id: existing.id },
    data,
  });

  await writeAuditEntry({
    tableName: 'businesses',
    recordId: row.id,
    action: 'update',
    userId,
    changes: {
      original: existing as unknown as Record<string, unknown>,
      new: serializeBusiness(row) as unknown as Record<string, unknown>,
    },
  });

  return serializeBusiness(row);
}
