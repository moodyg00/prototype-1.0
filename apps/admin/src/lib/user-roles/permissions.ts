import {
  DEFAULT_ROLE_PERMISSIONS,
  rolePermissionsSchema,
  type RolePermissions,
} from '@/src/lib/validation/user-roles';
import type { AvailabilitySubjectKind } from '@/src/lib/validation/scheduling';

export type ActingUser = {
  id: string;
  fullName: string;
  email: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: RolePermissions;
};

export function parseRolePermissions(value: unknown, roleName?: string | null): RolePermissions {
  const defaults =
    roleName && roleName in DEFAULT_ROLE_PERMISSIONS
      ? DEFAULT_ROLE_PERMISSIONS[roleName as keyof typeof DEFAULT_ROLE_PERMISSIONS]
      : {
          availability: { layers: [], scope: 'own' as const },
          settings: { read: false, write: false },
        };

  const merged =
    value && typeof value === 'object'
      ? { ...defaults, ...(value as Record<string, unknown>) }
      : defaults;

  const parsed = rolePermissionsSchema.safeParse(merged);
  return parsed.success
    ? parsed.data
    : { availability: { layers: [], scope: 'own' }, settings: { read: false, write: false } };
}

export function canReadSettings(user: ActingUser): boolean {
  return user.permissions.settings.read || user.permissions.settings.write;
}

export function canWriteSettings(user: ActingUser): boolean {
  return user.permissions.settings.write;
}

export function canManageAvailabilityLayer(
  user: ActingUser,
  layer: AvailabilitySubjectKind,
): boolean {
  return user.permissions.availability.layers.includes(layer);
}

export function canEditAvailabilitySubject(args: {
  user: ActingUser;
  subjectKind: AvailabilitySubjectKind;
  subjectUserId: string | null;
}): boolean {
  if (!canManageAvailabilityLayer(args.user, args.subjectKind)) return false;
  if (args.user.permissions.availability.scope === 'all') return true;
  if (args.subjectKind === 'owner' || args.subjectKind === 'contractor') {
    return args.subjectUserId === args.user.id;
  }
  return false;
}

export function filterVisibleAvailabilitySubjects(
  user: ActingUser,
  subjects: Array<{ subjectKind: AvailabilitySubjectKind; userId: string | null }>,
): Array<{ subjectKind: AvailabilitySubjectKind; userId: string | null }> {
  return subjects.filter((subject) =>
    canEditAvailabilitySubject({
      user,
      subjectKind: subject.subjectKind,
      subjectUserId: subject.userId,
    }),
  );
}
