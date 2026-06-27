/**
 * Idempotent seed for a clean single-pass database.
 *
 * Seeds the baseline reference/config data captured from local dev
 * (see prisma/seed-data/*.json):
 *   - user_roles
 *   - businesses (primary business profile)
 *   - chart_of_accounts (full COA, incl. parent hierarchy)
 *   - settings
 *   - integrations (API credentials)
 *   - credentials (saved logins)
 *
 * Ownership: every seeded row's created_by / updated_by is remapped to the
 * "owner" user, resolved at runtime by email (OWNER_EMAIL, default
 * info@moodyhomeservice.com). This keeps attribution valid against whatever
 * user IDs exist in the target database (e.g. the 2 preserved production users).
 *
 * Users are never deleted or overwritten. If the owner user does not exist
 * (e.g. a freshly reset local DB), it is created so the database is usable and
 * FK references resolve. Set SEED_ADMIN_PASSWORD to give that user a login.
 *
 * Re-running is safe: all rows are upserted by primary key.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync } from 'node:crypto';

import dotenv from 'dotenv';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

for (const envPath of [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../apps/admin/.env.local'),
  path.resolve(process.cwd(), '../../apps/admin/.env'),
]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? 'info@moodyhomeservice.com').toLowerCase();
const SEED_DATA_DIR = path.resolve(__dirname, 'seed-data');

const connectionString =
  process.env.DIRECT_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_POOLER_URL;

if (!connectionString) {
  throw new Error(
    'No database URL set. Provide DIRECT_DATABASE_URL / DATABASE_URL (or Supabase equivalents).',
  );
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function readSeed(name) {
  const file = path.join(SEED_DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing seed data file: ${file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function serializeValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);
  return value;
}

/** Upsert a single row by primary key (id), updating all non-id columns. */
async function upsertById(table, row) {
  const entries = Object.entries(row).filter(([, v]) => v !== undefined);
  const columns = entries.map(([k]) => quoteIdent(k));
  const placeholders = entries.map((_, i) => `$${i + 1}`);
  const updates = entries
    .filter(([k]) => k !== 'id')
    .map(([k]) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`);
  const sql =
    updates.length > 0
      ? `INSERT INTO ${quoteIdent(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})
         ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}`
      : `INSERT INTO ${quoteIdent(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})
         ON CONFLICT (id) DO NOTHING`;
  await client.query(sql, entries.map(([, v]) => serializeValue(v)));
}

/** Remap created_by / updated_by to the owner when those columns are present. */
function withOwner(row, ownerId) {
  const next = { ...row };
  if ('created_by' in next) next.created_by = ownerId;
  if ('updated_by' in next) next.updated_by = ownerId;
  return next;
}

async function getAdminRoleId() {
  const { rows } = await client.query(`SELECT id FROM user_roles WHERE name = 'Admin' LIMIT 1`);
  return rows[0]?.id ?? null;
}

async function resolveOwnerId() {
  const byEmail = await client.query(`SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`, [
    OWNER_EMAIL,
  ]);
  if (byEmail.rows[0]) return { id: byEmail.rows[0].id, created: false };

  const anyUser = await client.query(
    `SELECT id FROM users ORDER BY created_at ASC NULLS LAST LIMIT 1`,
  );
  if (anyUser.rows[0]) return { id: anyUser.rows[0].id, created: false };

  // No users exist (e.g. fresh local reset) — create the owner so the DB is usable.
  const roleId = await getAdminRoleId();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const passwordHash = password ? hashPassword(password) : null;
  const inserted = await client.query(
    `INSERT INTO users (email, full_name, password_hash, role_id, user_type, is_active)
     VALUES ($1, $2, $3, $4, 'human', true)
     RETURNING id`,
    [OWNER_EMAIL, 'Business Manager', passwordHash, roleId],
  );
  return { id: inserted.rows[0].id, created: true, passwordSet: Boolean(passwordHash) };
}

async function seedTable(table, ownerId, { remapOwner = true } = {}) {
  const rows = readSeed(table);
  for (const row of rows) {
    await upsertById(table, remapOwner ? withOwner(row, ownerId) : row);
  }
  return rows.length;
}

/**
 * COA rows reference each other via parent_id. Insert in two passes (first
 * without parent_id, then set parent_id) so FK constraints are always satisfied
 * regardless of row order, without disabling triggers.
 */
async function seedChartOfAccounts(ownerId) {
  const rows = readSeed('chart_of_accounts');
  for (const row of rows) {
    await upsertById('chart_of_accounts', withOwner({ ...row, parent_id: null }, ownerId));
  }
  let withParent = 0;
  for (const row of rows) {
    if (row.parent_id) {
      await client.query(`UPDATE chart_of_accounts SET parent_id = $2 WHERE id = $1`, [
        row.id,
        row.parent_id,
      ]);
      withParent += 1;
    }
  }
  return { total: rows.length, withParent };
}

/** Restore production users exported to seed-data/production-users-backup.json. */
async function restoreProductionUsers() {
  if (process.env.RESTORE_PRODUCTION_USERS !== '1') return 0;

  const backupPath = path.join(SEED_DATA_DIR, 'production-users-backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error('RESTORE_PRODUCTION_USERS=1 but production-users-backup.json is missing.');
  }

  const users = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  let restored = 0;

  for (const user of users) {
    const roleName = user.role_name ?? 'Admin';
    const { rows: roleRows } = await client.query(
      `SELECT id FROM user_roles WHERE name = $1 LIMIT 1`,
      [roleName],
    );
    if (!roleRows[0]) {
      throw new Error(`Cannot restore user ${user.email}: role "${roleName}" not found.`);
    }

    await upsertById('users', {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      password_hash: user.password_hash,
      api_key: user.api_key,
      user_type: user.user_type ?? 'human',
      role_id: roleRows[0].id,
      ai_model: user.ai_model,
      description: user.description,
      is_active: user.is_active ?? true,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
      updated_by: user.updated_by,
    });
    restored += 1;
  }

  return restored;
}

async function main() {
  await client.connect();
  await client.query('BEGIN');
  try {
    // Roles first (owner creation + users.role_id depend on them).
    const roles = await seedTable('user_roles', null, { remapOwner: false });

    const restoredUsers = await restoreProductionUsers();

    const owner = await resolveOwnerId();
    const ownerId = owner.id;

    const businesses = await seedTable('businesses', ownerId);
    const coa = await seedChartOfAccounts(ownerId);
    const settings = await seedTable('settings', ownerId);
    const integrations = await seedTable('integrations', ownerId);
    const credentials = await seedTable('credentials', ownerId);

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log(`  Owner: ${OWNER_EMAIL} (${ownerId})${owner.created ? ' [created]' : ''}`);
    if (owner.created && !owner.passwordSet) {
      console.log('    No password set — run create-admin or set SEED_ADMIN_PASSWORD to enable login.');
    }
    if (restoredUsers > 0) {
      console.log(`  production users restored: ${restoredUsers}`);
    }
    console.log(`  user_roles:        ${roles}`);
    console.log(`  businesses:        ${businesses}`);
    console.log(`  chart_of_accounts: ${coa.total} (${coa.withParent} with parent)`);
    console.log(`  settings:          ${settings}`);
    console.log(`  integrations:      ${integrations}`);
    console.log(`  credentials:       ${credentials}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
