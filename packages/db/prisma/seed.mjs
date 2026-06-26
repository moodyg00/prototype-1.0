import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../apps/admin/.env.local'),
  path.resolve(process.cwd(), '../../apps/admin/.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const connectionString =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_POOLER_URL;

if (!connectionString) {
  throw new Error(
    'No database URL is set. Create apps/admin/.env.local with DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_POOLER_URL).',
  );
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const DEFAULT_USER_ID = '11111111-1111-4111-8111-111111111111';
const DEFAULT_USER_EMAIL = 'dev@moodyhomeservice.com';
const DEFAULT_USER_NAME = 'Default User';

function rfc4122SeedUuid(uuid) {
  const parts = uuid.split('-');
  if (parts.length !== 5) throw new Error(`Invalid seed UUID: ${uuid}`);
  parts[2] = `4${parts[2].slice(1)}`;
  parts[3] = `8${parts[3].slice(1)}`;
  return parts.join('-');
}

function coaId(n) {
  return rfc4122SeedUuid(`f0000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`);
}

const chartAccountIds = {
  cash: coaId(1),
  receivables: coaId(2),
  clearing: coaId(3),
  payables: coaId(4),
  serviceRevenue: coaId(5),
  softwareExpense: coaId(6),
  marketingExpense: coaId(7),
};

/** UI layout demo UUIDs only — excludes COA (f0000000-*) rows. */
function collectDemoSeedIds() {
  const raw = [
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555551',
    '55555555-5555-5555-5555-555555555552',
    '55555555-5555-5555-5555-555555555553',
    '55555555-5555-5555-5555-555555555554',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666661',
    '66666666-6666-6666-6666-666666666662',
    '66666666-6666-6666-6666-666666666663',
    '77777777-7777-7777-7777-777777777771',
    '77777777-7777-7777-7777-777777777772',
    '77777777-7777-7777-7777-777777777773',
    '88888888-8888-8888-8888-888888888881',
    '88888888-8888-8888-8888-888888888882',
    '99999999-9999-9999-9999-999999999991',
    '99999999-9999-9999-9999-999999999992',
    '99999999-9999-9999-9999-999999999993',
    '99999999-9999-9999-9999-999999999994',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
    'abababab-abab-abab-abab-abababababab',
    'abababab-abab-abab-abab-abababababac',
    'abababab-abab-abab-abab-abababababad',
    'abababab-abab-abab-abab-abababababae',
    'abababab-abab-abab-abab-abababababaf',
    'abababab-abab-abab-abab-abababababb0',
    '5e1f1ce0-0000-0000-0000-000000000001',
    '5e1f1ce0-0000-0000-0000-000000000002',
    'e5717a7e-0000-0000-0000-000000000001',
    'b00c1117-0000-0000-0000-000000000001',
    'b00c1117-0000-0000-0000-000000000002',
    'b00c1117-0000-0000-0000-000000000003',
    'b0041240-0000-0000-0000-000000000001',
    'b0041240-0000-0000-0000-000000000002',
    'b0041240-0000-0000-0000-000000000003',
    'b0041240-0000-0000-0000-000000000004',
    'a7a11ab1-0000-0000-0000-000000000001',
    'a7a11ab1-0000-0000-0000-000000000002',
    'a7a11ab1-0000-0000-0000-000000000003',
    'a7a11ab1-0000-0000-0000-000000000004',
    'a7a11ab1-0000-0000-0000-000000000005',
    'a7a11ab1-0000-0000-0000-000000000006',
    'a7a11ab1-0000-0000-0000-000000000007',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd01',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd02',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd03',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd04',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd05',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd06',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd07',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd08',
    'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdff',
  ];

  const ids = new Set();
  for (const id of raw) {
    ids.add(id);
    ids.add(rfc4122SeedUuid(id));
  }
  return [...ids];
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function serializeValue(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return value;
}

async function tableExists(tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [tableName],
  );
  return rows.length > 0;
}

async function countTable(tableName) {
  if (!(await tableExists(tableName))) return 0;
  const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdentifier(tableName)}`);
  return rows[0].count;
}

async function upsertById(table, row) {
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => quoteIdentifier(key));
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const updateAssignments = entries
    .filter(([key]) => key !== 'id')
    .map(([key]) => `${quoteIdentifier(key)} = EXCLUDED.${quoteIdentifier(key)}`);

  const query =
    updateAssignments.length > 0
      ? `INSERT INTO ${quoteIdentifier(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${quoteIdentifier('id')}) DO UPDATE SET ${updateAssignments.join(', ')}`
      : `INSERT INTO ${quoteIdentifier(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${quoteIdentifier('id')}) DO NOTHING`;

  await client.query(query, entries.map(([, value]) => serializeValue(value)));
}

async function deleteDemoRowsById(table, ids) {
  if (!(await tableExists(table))) return 0;
  const { rowCount } = await client.query(
    `DELETE FROM ${quoteIdentifier(table)} WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  return rowCount ?? 0;
}

async function columnExists(tableName, columnName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2 LIMIT 1`,
    [tableName, columnName],
  );
  return rows.length > 0;
}

async function deleteLinkedDemoRows(table, column, ids) {
  if (!(await tableExists(table)) || !(await columnExists(table, column))) return 0;
  const { rowCount } = await client.query(
    `DELETE FROM ${quoteIdentifier(table)} WHERE ${quoteIdentifier(column)} = ANY($1::uuid[])`,
    [ids],
  );
  return rowCount ?? 0;
}

async function removeDemoUiData(demoIds) {
  const journalEntryIds = demoIds.filter((id) => id.startsWith('abababab'));
  if (await tableExists('journal_entry_lines')) {
    await client.query(`DELETE FROM journal_entry_lines WHERE journal_entry_id = ANY($1::uuid[])`, [
      journalEntryIds,
    ]);
  }

  const orgContactIds = demoIds.filter(
    (id) => id.startsWith('55555555') || id.startsWith('66666666') || id.startsWith('77777777'),
  );

  let removed = 0;
  removed += await deleteLinkedDemoRows('work_orders', 'contact_id', orgContactIds);
  removed += await deleteLinkedDemoRows('work_orders', 'organization_id', orgContactIds);
  removed += await deleteLinkedDemoRows('invoices', 'contact_id', orgContactIds);
  removed += await deleteLinkedDemoRows('invoices', 'organization_id', orgContactIds);
  removed += await deleteLinkedDemoRows('opportunities', 'contact_id', orgContactIds);
  removed += await deleteLinkedDemoRows('opportunities', 'organization_id', orgContactIds);

  const demoTables = [
    'change_log',
    'bookings',
    'availability_rules',
    'booking_links',
    'estimates',
    'services',
    'expenses',
    'payments',
    'bills',
    'bank_transactions',
    'bank_cards',
    'bank_merchants',
    'journal_entries',
    'journal_entry_lines',
    'bank_accounts',
    'leads',
    'contacts',
    'organizations',
    'businesses',
  ];

  for (const table of demoTables) {
    removed += await deleteDemoRowsById(table, demoIds);
  }
  return removed;
}

async function seedChartOfAccountsIfEmpty(userId) {
  const existing = await countTable('chart_of_accounts');
  if (existing > 0) {
    return { seeded: 0, skipped: true, existing };
  }

  let coaSeq = 8;
  const chartAccountDefs = [
    ['1000', 'Operating Cash', 'asset', 'bank', 'Primary operating cash account.', chartAccountIds.cash],
    ['1010', 'Savings Account', 'asset', 'bank', 'Business savings and reserve account.'],
    ['1020', 'Petty Cash', 'asset', 'bank', 'Cash on hand for small incidental purchases.'],
    ['1050', 'Undeposited Funds', 'asset', 'current_asset', 'Payments received but not yet deposited to the bank.'],
    ['1100', 'Accounts Receivable', 'asset', 'accounts_receivable', 'Customer receivables and open balances.', chartAccountIds.receivables],
    ['1150', 'Allowance for Doubtful Accounts', 'asset', 'contra_asset', 'Contra-asset reserve for estimated uncollectible receivables.'],
    ['1200', 'Merchant Clearing', 'asset', 'current_asset', 'Clearing account for card and payout activity.', chartAccountIds.clearing],
    ['2000', 'Accounts Payable', 'liability', 'accounts_payable', 'Vendor obligations awaiting payment.', chartAccountIds.payables],
    ['4100', 'Service Revenue', 'income', 'operating_revenue', 'Operating revenue from service delivery.', chartAccountIds.serviceRevenue],
    ['5200', 'Software & Subscriptions', 'expense', 'operating_expense', 'Recurring software and SaaS charges.', chartAccountIds.softwareExpense],
    ['5300', 'Marketing Expense', 'expense', 'operating_expense', 'Paid media and campaign spend.', chartAccountIds.marketingExpense],
  ];

  let seeded = 0;
  for (const [code, name, type, subType, description, fixedId] of chartAccountDefs) {
    await upsertById('chart_of_accounts', {
      id: fixedId ?? coaId(coaSeq++),
      code,
      name,
      type,
      sub_type: subType,
      description,
      is_active: true,
      created_by: userId,
      updated_by: userId,
    });
    seeded += 1;
  }
  return { seeded, skipped: false, existing: 0 };
}

async function replaceUsersWithDefault() {
  await client.query('SET session_replication_role = replica');
  try {
    const { rowCount } = await client.query('DELETE FROM users');
    await client.query(
      `INSERT INTO users (id, email, full_name, user_type, role, is_active)
       VALUES ($1, $2, $3, 'human', 'admin', true)`,
      [DEFAULT_USER_ID, DEFAULT_USER_EMAIL, DEFAULT_USER_NAME],
    );
    return rowCount ?? 0;
  } finally {
    await client.query('SET session_replication_role = DEFAULT');
  }
}

async function countPreservedRows() {
  return {
    chart_of_accounts: await countTable('chart_of_accounts'),
    settings: await countTable('settings'),
    credentials: await countTable('credentials'),
    integrations: await countTable('integrations'),
  };
}

async function main() {
  await client.connect();
  await client.query('BEGIN');

  try {
    const before = await countPreservedRows();
    const demoIds = collectDemoSeedIds();
    const demoRemoved = await removeDemoUiData(demoIds);
    const usersRemoved = await replaceUsersWithDefault();
    const coaResult = await seedChartOfAccountsIfEmpty(DEFAULT_USER_ID);
    const after = await countPreservedRows();

    if (after.chart_of_accounts < before.chart_of_accounts) {
      throw new Error(
        `COA row count decreased (${before.chart_of_accounts} -> ${after.chart_of_accounts}). Aborting.`,
      );
    }
    if (after.settings !== before.settings) {
      throw new Error(`settings count changed (${before.settings} -> ${after.settings})`);
    }
    if (after.credentials !== before.credentials) {
      throw new Error(`credentials count changed (${before.credentials} -> ${after.credentials})`);
    }
    if (after.integrations !== before.integrations) {
      throw new Error(`integrations count changed (${before.integrations} -> ${after.integrations})`);
    }

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log(`  Default user: ${DEFAULT_USER_EMAIL} (${DEFAULT_USER_ID}), role=admin`);
    console.log(`  Demo UI rows removed: ${demoRemoved}`);
    console.log(`  Users replaced: ${usersRemoved} removed, 1 inserted`);
    console.log(
      `  COA: before=${before.chart_of_accounts}, after=${after.chart_of_accounts}, seed=${coaResult.skipped ? 'skipped (existing rows preserved)' : `inserted ${coaResult.seeded}`}`,
    );
    console.log(
      `  Preserved — settings: ${before.settings} -> ${after.settings}, credentials: ${before.credentials} -> ${after.credentials}, integrations: ${before.integrations} -> ${after.integrations}`,
    );
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
