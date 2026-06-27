#!/usr/bin/env node
/**
 * Create or reset a human Admin user (email + password) in Postgres.
 *
 * Usage (from repo root):
 *   DIRECT_DATABASE_URL="postgresql://..." pnpm --filter @prototype/db create-admin -- --email you@example.com --password 'your-password'
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

import dotenv from 'dotenv';
import { Client } from 'pg';

for (const envPath of [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../apps/admin/.env.local'),
  path.resolve(process.cwd(), '../../apps/admin/.env'),
]) {
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function parseArgs(argv) {
  let email = process.env.ADMIN_EMAIL?.trim();
  let password = process.env.ADMIN_PASSWORD;
  let fullName = process.env.ADMIN_NAME?.trim() || 'Admin';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--email' && argv[i + 1]) email = argv[++i].trim().toLowerCase();
    else if (arg === '--password' && argv[i + 1]) password = argv[++i];
    else if (arg === '--name' && argv[i + 1]) fullName = argv[++i].trim();
    else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: DIRECT_DATABASE_URL=... pnpm --filter @prototype/db create-admin -- --email EMAIL --password PASSWORD [--name "Full Name"]',
      );
      process.exit(0);
    }
  }

  if (!email || !password) {
    console.error('Required: --email and --password (or ADMIN_EMAIL / ADMIN_PASSWORD env vars).');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  return { email, password, fullName };
}

async function main() {
  const { email, password, fullName } = parseArgs(process.argv.slice(2));
  const connectionString =
    process.env.DIRECT_DATABASE_URL ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.SUPABASE_POOLER_URL;

  if (!connectionString) {
    throw new Error('Set DATABASE_URL (or DIRECT_DATABASE_URL) to your Postgres connection string.');
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
  });

  await client.connect();

  try {
    const { rows: roleRows } = await client.query(
      `SELECT id FROM user_roles WHERE name = 'Admin' LIMIT 1`,
    );
    let adminRoleId = roleRows[0]?.id;
    if (!adminRoleId) {
      const inserted = await client.query(
        `INSERT INTO user_roles (name, permissions, is_system)
         VALUES ('Admin', '{"settings":{"read":true,"write":true}}'::jsonb, true)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
      );
      adminRoleId = inserted.rows[0].id;
    }

    const passwordHash = hashPassword(password);
    const { rows: existing } = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existing[0]) {
      await client.query(
        `UPDATE users
         SET full_name = $2, password_hash = $3, role_id = $4, user_type = 'human', is_active = true, updated_at = NOW()
         WHERE id = $1`,
        [existing[0].id, fullName, passwordHash, adminRoleId],
      );
      console.log(`Updated existing user ${email} (${existing[0].id}) with Admin role and new password.`);
    } else {
      const inserted = await client.query(
        `INSERT INTO users (email, full_name, password_hash, role_id, user_type, is_active)
         VALUES ($1, $2, $3, $4, 'human', true)
         RETURNING id`,
        [email, fullName, passwordHash, adminRoleId],
      );
      console.log(`Created admin user ${email} (${inserted.rows[0].id}).`);
    }

    console.log('Log in on admin and agent with this email and password.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
