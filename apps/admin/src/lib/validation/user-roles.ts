import { z } from 'zod';

import { AVAILABILITY_SUBJECT_KINDS } from '@/src/lib/validation/scheduling';

const uuid = z.string().uuid({ message: 'Must be a valid UUID.' });

export const AVAILABILITY_SCOPES = ['all', 'own'] as const;
export type AvailabilityScope = (typeof AVAILABILITY_SCOPES)[number];

export const rolePermissionsSchema = z.object({
  availability: z
    .object({
      layers: z.array(z.enum(AVAILABILITY_SUBJECT_KINDS)).default([]),
      scope: z.enum(AVAILABILITY_SCOPES).default('own'),
    })
    .default({ layers: [], scope: 'own' }),
  settings: z
    .object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
    })
    .default({ read: false, write: false }),
});

export type RolePermissions = z.infer<typeof rolePermissionsSchema>;

export const userRoleCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(80),
  permissions: rolePermissionsSchema.default({
    availability: { layers: [], scope: 'own' },
    settings: { read: false, write: false },
  }),
});

export const userRoleUpdateSchema = userRoleCreateSchema.partial();

export const userRoleAssignSchema = z.object({
  roleId: uuid,
});

export type UserRoleCreateInput = z.infer<typeof userRoleCreateSchema>;
export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
export type UserRoleAssignInput = z.infer<typeof userRoleAssignSchema>;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  Admin: {
    availability: { layers: ['owner', 'contractor', 'business', 'service'], scope: 'all' },
    settings: { read: true, write: true },
  },
  Owner: {
    availability: { layers: ['owner', 'contractor', 'business', 'service'], scope: 'all' },
    settings: { read: true, write: true },
  },
  Contractor: {
    availability: { layers: ['contractor'], scope: 'own' },
    settings: { read: false, write: false },
  },
};
