import type { PrismaClient } from '@prototype/db';

import { writeAuditEntry, auditSkipStorage, type AuditChanges, type ChangeLogAction } from '@/src/lib/change-log';
import { getModelTableName, modelToDelegate } from '@/src/lib/prisma-audit-tables';

const AUDIT_EXCLUDED_MODELS = new Set(['ChangeLog']);

const TITLE_FIELDS = [
  'name',
  'title',
  'fullName',
  'invoiceNumber',
  'estimateNumber',
  'entryNumber',
  'email',
  'username',
] as const;

const SECRET_FIELD_PATTERN =
  /password|secret|token|apikey|api_key|credential|private/i;

type RecordLike = Record<string, unknown>;

function shouldSkipAudit(model: string): boolean {
  if (AUDIT_EXCLUDED_MODELS.has(model)) return true;
  if (auditSkipStorage.getStore()) return true;
  return false;
}

function isSecretField(key: string): boolean {
  return SECRET_FIELD_PATTERN.test(key);
}

function serializeForAudit(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeForAudit);
  if (typeof value === 'object') {
    if (typeof (value as { toJSON?: () => unknown }).toJSON === 'function') {
      return serializeForAudit((value as { toJSON: () => unknown }).toJSON());
    }
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as RecordLike)) {
      out[key] = serializeForAudit(nested);
    }
    return out;
  }
  return value;
}

function redactRecord(record: RecordLike): RecordLike {
  const out: RecordLike = {};
  for (const [key, value] of Object.entries(record)) {
    if (isSecretField(key) && value !== null && value !== undefined && String(value).length > 0) {
      out[key] = '[redacted]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

function toAuditRecord(value: unknown): RecordLike | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const serialized = serializeForAudit(value) as RecordLike;
  return redactRecord(serialized);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function buildUpdateChanges(
  before: RecordLike,
  after: RecordLike,
): { original: RecordLike; new: RecordLike } | null {
  const original: RecordLike = {};
  const next: RecordLike = {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  for (const key of keys) {
    if (key === 'updatedAt') continue;
    const prev = before[key];
    const curr = after[key];
    if (!valuesEqual(prev, curr)) {
      original[key] = prev ?? null;
      next[key] = curr ?? null;
    }
  }

  if (Object.keys(original).length === 0) return null;
  return { original, new: next };
}

function extractRecordId(record: RecordLike): string | null {
  const id = record.id;
  if (typeof id === 'string' && id.length > 0) return id;
  return null;
}

function extractRecordTitle(record: RecordLike): string | undefined {
  for (const field of TITLE_FIELDS) {
    const value = record[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function getDelegate(client: PrismaClient, model: string): {
  findUnique?: (args: { where: unknown }) => Promise<unknown>;
  findFirst?: (args: { where: unknown }) => Promise<unknown>;
  findMany?: (args: { where: unknown }) => Promise<unknown[]>;
} | null {
  const delegate = (client as unknown as Record<string, unknown>)[modelToDelegate(model)];
  if (!delegate || typeof delegate !== 'object') return null;
  return delegate as {
    findUnique?: (args: { where: unknown }) => Promise<unknown>;
    findFirst?: (args: { where: unknown }) => Promise<unknown>;
    findMany?: (args: { where: unknown }) => Promise<unknown[]>;
  };
}

async function fetchBeforeState(
  client: PrismaClient,
  model: string,
  where: unknown,
): Promise<RecordLike | null> {
  const delegate = getDelegate(client, model);
  if (!delegate) return null;

  try {
    if (delegate.findUnique) {
      const row = await delegate.findUnique({ where });
      return row ? toAuditRecord(row) : null;
    }
    if (delegate.findFirst) {
      const row = await delegate.findFirst({ where });
      return row ? toAuditRecord(row) : null;
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchManyBeforeState(
  client: PrismaClient,
  model: string,
  where: unknown,
): Promise<RecordLike[]> {
  const delegate = getDelegate(client, model);
  if (!delegate?.findMany) return [];

  try {
    const rows = await delegate.findMany({ where });
    return rows.map((row) => toAuditRecord(row)).filter((row): row is RecordLike => row !== null);
  } catch {
    return [];
  }
}

async function recordAudit(args: {
  model: string;
  recordId: string;
  action: ChangeLogAction;
  changes?: AuditChanges;
  record?: RecordLike | null;
}): Promise<void> {
  const tableName = getModelTableName(args.model);
  const recordTitle = args.record ? extractRecordTitle(args.record) : undefined;

  await writeAuditEntry({
    tableName,
    recordId: args.recordId,
    action: args.action,
    changes: args.changes,
    metadata: {
      source: 'database',
      ...(recordTitle ? { recordTitle } : {}),
    },
  });
}

async function fetchRecordById(
  client: PrismaClient,
  model: string,
  recordId: string,
): Promise<RecordLike | null> {
  const delegate = getDelegate(client, model);
  if (!delegate?.findUnique) return null;
  try {
    const row = await delegate.findUnique({ where: { id: recordId } });
    return row ? toAuditRecord(row) : null;
  } catch {
    return null;
  }
}

async function auditCreate(client: PrismaClient, model: string, result: unknown): Promise<void> {
  if (shouldSkipAudit(model)) return;
  let record = toAuditRecord(result);
  const recordId = record ? extractRecordId(record) : null;
  if (recordId) {
    const full = await fetchRecordById(client, model, recordId);
    if (full) record = full;
  }
  if (!record) return;
  if (!recordId) return;

  await recordAudit({
    model,
    recordId,
    action: 'create',
    changes: { new: record },
    record,
  });
}

async function auditUpdate(
  client: PrismaClient,
  model: string,
  before: RecordLike | null,
  result: unknown,
): Promise<void> {
  if (shouldSkipAudit(model)) return;
  let after = toAuditRecord(result);
  const recordId = after ? extractRecordId(after) : null;
  if (recordId) {
    const full = await fetchRecordById(client, model, recordId);
    if (full) after = full;
  }
  if (!after) return;
  if (!recordId) return;

  const diff = before ? buildUpdateChanges(before, after) : null;
  const changes: AuditChanges = diff ?? { new: after };

  await recordAudit({
    model,
    recordId,
    action: 'update',
    changes,
    record: after,
  });
}

async function auditDelete(model: string, before: RecordLike | null): Promise<void> {
  if (shouldSkipAudit(model)) return;
  if (!before) return;
  const recordId = extractRecordId(before);
  if (!recordId) return;

  await recordAudit({
    model,
    recordId,
    action: 'delete',
    changes: { original: before },
    record: before,
  });
}

export function withAuditExtension<T extends PrismaClient>(client: T): T {
  return client.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          void auditCreate(client, model, result);
          return result;
        },
        async createManyAndReturn({ model, args, query }) {
          const result = await query(args);
          if (Array.isArray(result)) {
            for (const row of result) {
              void auditCreate(client, model, row);
            }
          }
          return result;
        },
        async update({ model, args, query }) {
          const before = await fetchBeforeState(client, model, args.where);
          const result = await query(args);
          void auditUpdate(client, model, before, result);
          return result;
        },
        async updateMany({ model, args, query }) {
          const beforeRows = await fetchManyBeforeState(client, model, args.where);
          const result = await query(args);
          const patch = toAuditRecord(args.data) ?? {};
          for (const before of beforeRows) {
            const recordId = extractRecordId(before);
            if (!recordId) continue;
            const after: RecordLike = { ...before, ...patch };
            const diff = buildUpdateChanges(before, after);
            if (!diff) continue;
            void recordAudit({
              model,
              recordId,
              action: 'update',
              changes: diff,
              record: after,
            });
          }
          return result;
        },
        async upsert({ model, args, query }) {
          const before = await fetchBeforeState(client, model, args.where);
          const result = await query(args);
          if (before) {
            void auditUpdate(client, model, before, result);
          } else {
            void auditCreate(client, model, result);
          }
          return result;
        },
        async delete({ model, args, query }) {
          const before = await fetchBeforeState(client, model, args.where);
          const result = await query(args);
          void auditDelete(model, before);
          return result;
        },
        async deleteMany({ model, args, query }) {
          const beforeRows = await fetchManyBeforeState(client, model, args.where);
          const result = await query(args);
          for (const before of beforeRows) {
            void auditDelete(model, before);
          }
          return result;
        },
      },
    },
  }) as T;
}
