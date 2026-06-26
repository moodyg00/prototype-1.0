import { Prisma } from '@prototype/db';

import { writeAuditEntry, redactForChangeLog } from '@/src/lib/change-log';
import { prisma } from '@/src/lib/prisma';
import {
  getRegistryEntry,
  isProtectedSetting,
  parseSettingValue,
  SECRET_MASK,
  validateSettingValue,
} from '@/src/lib/settings/registry';
import { SettingsServiceError } from '@/src/lib/settings/errors';

export type SettingRow = {
  id: string;
  module: string;
  key: string;
  value: unknown;
  description: string | null;
  isSensitive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function serializeSetting(row: {
  id: string;
  module: string;
  key: string;
  value: unknown;
  description: string | null;
  isSensitive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}): SettingRow {
  return {
    id: row.id,
    module: row.module,
    key: row.key,
    value: row.value,
    description: row.description,
    isSensitive: row.isSensitive,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

function maskSecretFields(value: unknown, secretKeys: string[]): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const out = { ...(value as Record<string, unknown>) };
  for (const key of secretKeys) {
    if (key in out && out[key] !== undefined && out[key] !== null && String(out[key]).length > 0) {
      out[key] = SECRET_MASK;
    }
  }
  return out;
}

export function maskSettingValue(row: Pick<SettingRow, 'module' | 'key' | 'value' | 'isSensitive'>): unknown {
  if (!row.isSensitive) return row.value;
  if (row.module === 'system' && row.key === 'cron') {
    return maskSecretFields(row.value, ['secret']);
  }
  return row.value;
}

export function maskSettingRow(row: SettingRow): SettingRow {
  return {
    ...row,
    value: maskSettingValue(row),
  };
}

export async function getSetting(module: string, key: string): Promise<SettingRow | null> {
  const row = await prisma.setting.findUnique({
    where: { module_key: { module, key } },
  });
  if (!row) return null;
  return serializeSetting(row);
}

export async function getSettingValue<T>(module: string, key: string, fallback?: T): Promise<T> {
  const row = await getSetting(module, key);
  if (!row) {
    const entry = getRegistryEntry(module, key);
    return (entry?.defaultValue as T) ?? (fallback as T);
  }
  return parseSettingValue(module, key, row.value) as T;
}

export async function listSettings(module?: string): Promise<SettingRow[]> {
  const rows = await prisma.setting.findMany({
    where: module ? { module } : undefined,
    orderBy: [{ module: 'asc' }, { key: 'asc' }],
  });
  return rows.map(serializeSetting);
}

type UpsertSettingArgs = {
  module: string;
  key: string;
  value: unknown;
  description?: string | null;
  isSensitive?: boolean;
  userId?: string | null;
  preserveSecrets?: boolean;
};

function mergePreservedSecrets(
  module: string,
  key: string,
  incoming: unknown,
  existing: unknown,
): unknown {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) return incoming;
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) return incoming;

  const next = { ...(incoming as Record<string, unknown>) };
  const prev = existing as Record<string, unknown>;

  if (module === 'system' && key === 'cron') {
    const secret = next.secret;
    if (secret === undefined || secret === '' || secret === SECRET_MASK) {
      next.secret = prev.secret ?? '';
    }
  }

  return next;
}

export async function upsertSetting(args: UpsertSettingArgs): Promise<SettingRow> {
  const entry = getRegistryEntry(args.module, args.key);
  const existing = await prisma.setting.findUnique({
    where: { module_key: { module: args.module, key: args.key } },
  });

  let rawValue = args.value;
  if (args.preserveSecrets && existing) {
    rawValue = mergePreservedSecrets(args.module, args.key, rawValue, existing.value);
  }

  const validated = validateSettingValue(args.module, args.key, rawValue);
  const description = args.description ?? entry?.description ?? existing?.description ?? null;
  const isSensitive = args.isSensitive ?? entry?.isSensitive ?? existing?.isSensitive ?? false;

  const row = await prisma.setting.upsert({
    where: { module_key: { module: args.module, key: args.key } },
    create: {
      module: args.module,
      key: args.key,
      value: validated as Prisma.InputJsonValue,
      description,
      isSensitive,
      createdBy: args.userId ?? null,
      updatedBy: args.userId ?? null,
    },
    update: {
      value: validated as Prisma.InputJsonValue,
      description,
      isSensitive,
      updatedBy: args.userId ?? null,
    },
  });

  await writeAuditEntry({
    tableName: 'settings',
    recordId: row.id,
    action: existing ? 'update' : 'create',
    userId: args.userId,
    changes: existing
      ? {
          original: redactForChangeLog({ module: args.module, key: args.key, value: existing.value }),
          new: redactForChangeLog({ module: args.module, key: args.key, value: validated }),
        }
      : { new: redactForChangeLog({ module: args.module, key: args.key, value: validated }) },
  });

  return serializeSetting(row);
}

export async function deleteSetting(module: string, key: string, userId?: string | null): Promise<void> {
  if (isProtectedSetting(module, key)) {
    throw new SettingsServiceError('This system setting cannot be deleted.', 403);
  }

  const existing = await prisma.setting.findUnique({
    where: { module_key: { module, key } },
  });
  if (!existing) {
    throw new SettingsServiceError('Setting not found.', 404);
  }

  await prisma.setting.delete({ where: { module_key: { module, key } } });

  await writeAuditEntry({
    tableName: 'settings',
    recordId: existing.id,
    action: 'delete',
    userId,
    changes: {
      original: redactForChangeLog({ module, key, value: existing.value }),
    },
  });
}

export type SystemSettingsBundle = {
  app: { url: string };
  cron: { secret: string };
};

export async function getSystemSettingsBundle(masked = true): Promise<SystemSettingsBundle> {
  const [appRow, cronRow] = await Promise.all([
    getSetting('system', 'app'),
    getSetting('system', 'cron'),
  ]);

  const app = parseSettingValue('system', 'app', appRow?.value) as { url: string };
  let cron = parseSettingValue('system', 'cron', cronRow?.value) as { secret: string };

  if (masked) {
    cron = maskSecretFields(cron, ['secret']) as { secret: string };
  }

  return { app, cron };
}

export async function upsertSystemSettingsBundle(
  incoming: SystemSettingsBundle,
  userId?: string | null,
): Promise<SystemSettingsBundle> {
  await upsertSetting({
    module: 'system',
    key: 'app',
    value: incoming.app,
    userId,
  });
  await upsertSetting({
    module: 'system',
    key: 'cron',
    value: incoming.cron,
    userId,
    preserveSecrets: true,
  });
  return getSystemSettingsBundle(true);
}
