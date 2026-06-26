import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

const envPaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const connectionString =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? process.env.SUPABASE_POOLER_URL;
if (!connectionString) {
  throw new Error(
    'No database URL is set. Create .env.local with DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_POOLER_URL).'
  );
}

const client = new Client({
  connectionString,
  ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

/** Set RFC-4122 version (4) and variant (10xx) nibbles on deterministic seed UUIDs. */
function rfc4122SeedUuid(uuid) {
  const parts = uuid.split('-');
  if (parts.length !== 5) {
    throw new Error(`Invalid seed UUID: ${uuid}`);
  }
  parts[2] = `4${parts[2].slice(1)}`;
  parts[3] = `8${parts[3].slice(1)}`;
  return parts.join('-');
}

const rawIds = {
  users: {
    admin: '11111111-1111-1111-1111-111111111111',
    manager: '22222222-2222-2222-2222-222222222222',
    operator: '33333333-3333-3333-3333-333333333333',
  },
  business: '44444444-4444-4444-4444-444444444444',
  organizations: {
    northside: '55555555-5555-5555-5555-555555555551',
    oakridge: '55555555-5555-5555-5555-555555555552',
    summit: '55555555-5555-5555-5555-555555555553',
    alliedSupply: '55555555-5555-5555-5555-555555555554',
    metroLogistics: '55555555-5555-5555-5555-555555555555',
  },
  contacts: {
    avery: '66666666-6666-6666-6666-666666666661',
    jordan: '66666666-6666-6666-6666-666666666662',
    mara: '66666666-6666-6666-6666-666666666663',
  },
  leads: {
    northside: '77777777-7777-7777-7777-777777777771',
    oakridge: '77777777-7777-7777-7777-777777777772',
    summit: '77777777-7777-7777-7777-777777777773',
  },
  bankAccounts: {
    operating: '88888888-8888-8888-8888-888888888881',
    cardClearing: '88888888-8888-8888-8888-888888888882',
  },
  chartAccounts: {
    cash: 'f0000000-0000-0000-0000-000000000001',
    receivables: 'f0000000-0000-0000-0000-000000000002',
    clearing: 'f0000000-0000-0000-0000-000000000003',
    payables: 'f0000000-0000-0000-0000-000000000004',
    serviceRevenue: 'f0000000-0000-0000-0000-000000000005',
    softwareExpense: 'f0000000-0000-0000-0000-000000000006',
    marketingExpense: 'f0000000-0000-0000-0000-000000000007',
  },
  bankMerchants: {
    stripe: '99999999-9999-9999-9999-999999999991',
    adobe: '99999999-9999-9999-9999-999999999992',
    googleAds: '99999999-9999-9999-9999-999999999993',
    twilio: '99999999-9999-9999-9999-999999999994',
  },
  bankCards: {
    operations: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    marketing: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  },
  bankTransactions: {
    income1: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    income2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    expense1: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    expense2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
  },
  bills: {
    allied: 'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    north: 'cccccccc-cccc-cccc-cccc-ccccccccccc2',
  },
  payments: {
    bill1: 'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    bill2: 'dddddddd-dddd-dddd-dddd-ddddddddddd2',
  },
  expenses: {
    adobe: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1',
    metro: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2',
  },
  journalEntries: {
    invoicePayment: 'abababab-abab-abab-abab-abababababab',
    payoutBatch: 'abababab-abab-abab-abab-abababababac',
    alliedBillPayment: 'abababab-abab-abab-abab-abababababad',
    metroBillPayment: 'abababab-abab-abab-abab-abababababae',
    adobeExpense: 'abababab-abab-abab-abab-abababababaf',
    googleAdsExpense: 'abababab-abab-abab-abab-abababababb0',
  },
  services: {
    hvacTuneup: '5e1f1ce0-0000-0000-0000-000000000001',
    consult: '5e1f1ce0-0000-0000-0000-000000000002',
  },
  estimates: {
    averyRetrofit: 'e5717a7e-0000-0000-0000-000000000001',
  },
  bookingLinks: {
    consult: 'b00c1117-0000-0000-0000-000000000001',
    averyPersonalized: 'b00c1117-0000-0000-0000-000000000002',
    jordanConfirm: 'b00c1117-0000-0000-0000-000000000003',
  },
  bookings: {
    confirmed: 'b0041240-0000-0000-0000-000000000001',
    pending: 'b0041240-0000-0000-0000-000000000002',
    unconfirmed: 'b0041240-0000-0000-0000-000000000003',
    draft: 'b0041240-0000-0000-0000-000000000004',
  },
  availabilityRules: {
    businessMon: 'a7a11ab1-0000-0000-0000-000000000001',
    businessTue: 'a7a11ab1-0000-0000-0000-000000000002',
    businessWed: 'a7a11ab1-0000-0000-0000-000000000003',
    contractorMon: 'a7a11ab1-0000-0000-0000-000000000004',
    ownerBlocked: 'a7a11ab1-0000-0000-0000-000000000005',
    serviceWindow: 'a7a11ab1-0000-0000-0000-000000000006',
    contactPref: 'a7a11ab1-0000-0000-0000-000000000007',
  },
  changeLog: {
    orgCreate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd01',
    leadCreate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd02',
    leadUpdate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd03',
    billCreate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd04',
    paymentUpdate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd05',
    bankAutomation: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd06',
    contactCreate: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd07',
    estimateDelete: 'cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcd08',
  },
};

function mapSeedIds(value) {
  if (typeof value === 'string') {
    return rfc4122SeedUuid(value);
  }
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, mapSeedIds(nested)]));
}

const ids = mapSeedIds(rawIds);

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// Deterministic fixed UUIDs for chart-of-accounts seed rows, continuing the
// `f0000000-0000-4000-8000-00000000000X` convention used for the original
// seeded accounts (ids 1-7). New accounts use ids 8+ so re-seeding stays
// idempotent and existing account ids/codes are never disturbed.
function coaId(n) {
  return rfc4122SeedUuid(`f0000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`);
}

function serializeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value) || (value && typeof value === 'object')) {
    return JSON.stringify(value);
  }

  return value;
}

async function upsertById(table, row) {
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => quoteIdentifier(key));
  const placeholders = entries.map((_, index) => `$${index + 1}`);
  const updateAssignments = entries
    .filter(([key]) => key !== 'id')
    .map(([key]) => `${quoteIdentifier(key)} = EXCLUDED.${quoteIdentifier(key)}`);

  const query = updateAssignments.length > 0
    ? `INSERT INTO ${quoteIdentifier(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${quoteIdentifier('id')}) DO UPDATE SET ${updateAssignments.join(', ')}`
    : `INSERT INTO ${quoteIdentifier(table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (${quoteIdentifier('id')}) DO NOTHING`;

  await client.query(query, entries.map(([, value]) => serializeValue(value)));
}

/** Collect [legacyId, rfcId] pairs from nested rawIds and supplemental COA ids. */
function collectLegacyIdPairs() {
  const pairs = [];
  const seen = new Set();

  function addPair(rawId) {
    const rfcId = rfc4122SeedUuid(rawId);
    if (rawId === rfcId || seen.has(rawId)) return;
    seen.add(rawId);
    pairs.push([rawId, rfcId]);
  }

  function walk(value) {
    if (typeof value === 'string') {
      addPair(value);
      return;
    }
    for (const nested of Object.values(value)) {
      walk(nested);
    }
  }

  walk(rawIds);
  addPair('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdff');
  for (let n = 8; n <= 100; n += 1) {
    addPair(`f0000000-0000-0000-0000-${n.toString(16).padStart(12, '0')}`);
  }
  return pairs;
}

let cachedUuidColumns;

async function getPublicUuidColumns() {
  if (cachedUuidColumns) return cachedUuidColumns;
  const { rows } = await client.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND udt_name = 'uuid'
    ORDER BY table_name, column_name
  `);
  cachedUuidColumns = rows;
  return rows;
}

/** True when a legacy seed PK exists and the RFC target PK does not. */
async function shouldMigrateLegacyId(oldId, newId, idTables) {
  let oldPkExists = false;
  let newPkExists = false;

  for (const table of idTables) {
    const oldRow = await client.query(`SELECT 1 FROM ${quoteIdentifier(table)} WHERE id = $1 LIMIT 1`, [oldId]);
    if (oldRow.rowCount > 0) oldPkExists = true;
    const newRow = await client.query(`SELECT 1 FROM ${quoteIdentifier(table)} WHERE id = $1 LIMIT 1`, [newId]);
    if (newRow.rowCount > 0) newPkExists = true;
    if (oldPkExists && newPkExists) break;
  }

  return oldPkExists && !newPkExists;
}

/**
 * Rewrite pre-RFC seed UUIDs to RFC-4122 ids so upsertById stays idempotent on
 * dev DBs that were seeded before the rfc4122SeedUuid() migration.
 */
async function migrateLegacySeedIds() {
  const pairs = collectLegacyIdPairs();
  const uuidColumns = await getPublicUuidColumns();
  const idTables = [...new Set(uuidColumns.filter((col) => col.column_name === 'id').map((col) => col.table_name))];
  const fkColumns = uuidColumns.filter((col) => col.column_name !== 'id');

  await client.query('SET session_replication_role = replica');

  try {
    for (const [oldId, newId] of pairs) {
      if (!(await shouldMigrateLegacyId(oldId, newId, idTables))) continue;

      for (const { table_name, column_name } of fkColumns) {
        await client.query(
          `UPDATE ${quoteIdentifier(table_name)} SET ${quoteIdentifier(column_name)} = $2 WHERE ${quoteIdentifier(column_name)} = $1`,
          [oldId, newId],
        );
      }

      for (const table of idTables) {
        await client.query(
          `UPDATE ${quoteIdentifier(table)} SET id = $2 WHERE id = $1`,
          [oldId, newId],
        );
      }
    }
  } finally {
    await client.query('SET session_replication_role = DEFAULT');
  }
}

async function main() {
  await client.connect();
  await client.query('BEGIN');

  try {
    await migrateLegacySeedIds();

    const now = new Date();
    const today = new Date('2026-05-29T00:00:00.000Z');
    const nextWeek = new Date('2026-06-05T00:00:00.000Z');

    const userRows = [
      {
        id: ids.users.admin,
        email: 'jordan@proto2.app',
        full_name: 'Jordan Diaz',
        user_type: 'human',
        role: 'admin',
        is_active: true,
      },
      {
        id: ids.users.manager,
        email: 'nina@proto2.app',
        full_name: 'Nina Tran',
        user_type: 'human',
        role: 'manager',
        is_active: true,
      },
      {
        id: ids.users.operator,
        email: 'sam@proto2.app',
        full_name: 'Sam Ortega',
        user_type: 'human',
        role: 'user',
        is_active: true,
      },
    ];
    for (const row of userRows) {
      await upsertById('users', row);
    }

    await upsertById('businesses', {
      id: ids.business,
      name: 'Proto 2 Demo Co',
      legal_name: 'Proto 2 Demo Company LLC',
      email: 'hello@proto2.app',
      phone: '+1 (555) 010-2000',
      website: 'https://proto2.app',
      city: 'Austin',
      state: 'TX',
      country: 'US',
      primary_color: '#0f172a',
      accent_color: '#0891b2',
      default_payment_terms: 'Net 15',
      document_intro_text: 'Thanks for choosing Proto 2 Demo Co.',
      document_footer_text: 'Built with the Proto-2 admin layer.',
      is_primary: true,
    });

    const organizationRows = [
      {
        id: ids.organizations.northside,
        name: 'Northside Plaza',
        relationship_type: 'customer',
        organization_type: 'company',
        industry: 'Commercial property',
        phone: '+1 (512) 555-0101',
        website: 'https://northside-plaza.example',
        status: 'active',
        address: { city: 'Austin', state: 'TX', country: 'US' },
        tags: ['commercial', 'multi-site'],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.organizations.oakridge,
        name: 'Oakridge HOA',
        relationship_type: 'customer',
        organization_type: 'other',
        industry: 'Homeowners association',
        phone: '+1 (512) 555-0102',
        website: 'https://oakridge-hoa.example',
        status: 'active',
        address: { city: 'Round Rock', state: 'TX', country: 'US' },
        tags: ['hoa', 'recurring'],
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.organizations.summit,
        name: 'Summit Estates',
        relationship_type: 'customer',
        organization_type: 'company',
        industry: 'Residential development',
        phone: '+1 (512) 555-0103',
        website: 'https://summit-estates.example',
        status: 'pending',
        address: { city: 'Cedar Park', state: 'TX', country: 'US' },
        tags: ['builder', 'referral'],
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.organizations.alliedSupply,
        name: 'Allied Supply',
        relationship_type: 'vendor',
        organization_type: 'company',
        industry: 'Wholesale supply',
        phone: '+1 (512) 555-0104',
        website: 'https://allied-supply.example',
        status: 'active',
        tags: ['vendor', 'materials'],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.organizations.metroLogistics,
        name: 'Metro Logistics',
        relationship_type: 'vendor',
        organization_type: 'company',
        industry: 'Fleet services',
        phone: '+1 (512) 555-0105',
        website: 'https://metro-logistics.example',
        status: 'active',
        tags: ['vendor', 'transport'],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of organizationRows) {
      await upsertById('organizations', row);
    }

    const contactRows = [
      {
        id: ids.contacts.avery,
        organization_id: ids.organizations.northside,
        title: 'Facilities Lead',
        type: 'customer',
        name: 'Avery Kim',
        email: 'avery@northside-plaza.example',
        phone: '+1 (512) 555-0110',
        status: 'active',
        source: 'referral',
        tags: ['decision maker', 'sms'],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.contacts.jordan,
        organization_id: ids.organizations.oakridge,
        title: 'Controller',
        type: 'customer',
        name: 'Jordan Pike',
        email: 'jpike@oakridge-hoa.example',
        phone: '+1 (512) 555-0111',
        status: 'active',
        source: 'website_organic',
        tags: ['billing', 'ach'],
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.contacts.mara,
        organization_id: ids.organizations.summit,
        title: 'Regional VP',
        type: 'customer',
        name: 'Mara Quinn',
        email: 'mara@summit-estates.example',
        phone: '+1 (512) 555-0112',
        status: 'inactive',
        source: 'in_person',
        tags: ['vip', 'escalation'],
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
    ];
    for (const row of contactRows) {
      await upsertById('contacts', row);
    }

    const leadRows = [
      {
        id: ids.leads.northside,
        contact_id: ids.contacts.avery,
        organization_id: ids.organizations.northside,
        name: 'Northside HVAC Retrofit',
        phone: '+1 (512) 555-0110',
        email: 'avery@northside-plaza.example',
        source: 'referral',
        status: 'quoted',
        assigned_to: ids.users.manager,
        next_follow_up: nextWeek,
        expected_value: '18400.00',
        notes: { summary: 'Quote sent, waiting on facility review.' },
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.leads.oakridge,
        contact_id: ids.contacts.jordan,
        organization_id: ids.organizations.oakridge,
        name: 'Oakridge Comfort Plan',
        phone: '+1 (512) 555-0111',
        email: 'jpike@oakridge-hoa.example',
        source: 'website_organic',
        status: 'contacted',
        assigned_to: ids.users.manager,
        next_follow_up: today,
        expected_value: '6920.00',
        notes: { summary: 'Maintenance package review in progress.' },
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.leads.summit,
        contact_id: ids.contacts.mara,
        organization_id: ids.organizations.summit,
        name: 'Summit Cooling Retrofit',
        phone: '+1 (512) 555-0112',
        email: 'mara@summit-estates.example',
        source: 'in_person',
        status: 'new',
        assigned_to: ids.users.operator,
        next_follow_up: today,
        expected_value: '24300.00',
        notes: { summary: 'New commercial retrofit opportunity.' },
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of leadRows) {
      await upsertById('leads', row);
    }

    const bankAccountRows = [
      {
        id: ids.bankAccounts.operating,
        name: 'Operating Checking',
        account_type: 'checking',
        bank_name: 'Mercury',
        provider: 'mercury',
        provider_account_id: 'acct_proto2_operating',
        status: 'active',
        currency: 'USD',
        current_balance: '287420.00',
        is_active: true,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bankAccounts.cardClearing,
        name: 'Card Clearing',
        account_type: 'credit_card',
        bank_name: 'Mercury',
        provider: 'mercury',
        provider_account_id: 'acct_proto2_card',
        status: 'active',
        currency: 'USD',
        current_balance: '12430.00',
        is_active: true,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of bankAccountRows) {
      await upsertById('bank_accounts', row);
    }

    // Standard chart of accounts for a medium-size local service business
    // (electrical / HVAC / plumbing / maintenance contractor). Organized by a
    // conventional numeric scheme: 1xxx assets, 2xxx liabilities, 3xxx equity,
    // 4xxx income, 5xxx cost of services (COGS), 6xxx-7xxx operating expenses,
    // 8xxx-9xxx other income/expense. `sub_type` refines `type` (see schema
    // CHECK comment). Contra accounts are encoded via sub_type + name.
    //
    // Each tuple: [code, name, type, sub_type, description, fixedId?].
    // The original seven seeded accounts pass their existing fixed id so their
    // ids/codes are preserved (and downstream journal-entry-line FKs hold);
    // every new account is assigned a deterministic id (8+) via coaId().
    let coaSeq = 8;
    const chartAccountDefs = [
      // ---- 1000-1999 Assets ----
      ['1000', 'Operating Cash', 'asset', 'bank', 'Primary operating cash account.', ids.chartAccounts.cash],
      ['1010', 'Savings Account', 'asset', 'bank', 'Business savings and reserve account.'],
      ['1020', 'Petty Cash', 'asset', 'bank', 'Cash on hand for small incidental purchases.'],
      ['1050', 'Undeposited Funds', 'asset', 'current_asset', 'Payments received but not yet deposited to the bank.'],
      ['1100', 'Accounts Receivable', 'asset', 'accounts_receivable', 'Customer receivables and open balances.', ids.chartAccounts.receivables],
      ['1150', 'Allowance for Doubtful Accounts', 'asset', 'contra_asset', 'Contra-asset reserve for estimated uncollectible receivables.'],
      ['1200', 'Merchant Clearing', 'asset', 'current_asset', 'Clearing account for card and payout activity.', ids.chartAccounts.clearing],
      ['1250', 'Employee Advances', 'asset', 'current_asset', 'Advances and reimbursable amounts owed by employees.'],
      ['1300', 'Inventory - Materials & Parts', 'asset', 'inventory', 'Materials, parts, and supplies held for jobs and resale.'],
      ['1400', 'Prepaid Expenses', 'asset', 'current_asset', 'Expenses paid in advance such as deposits and retainers.'],
      ['1410', 'Prepaid Insurance', 'asset', 'current_asset', 'Insurance premiums paid in advance.'],
      ['1500', 'Vehicles', 'asset', 'fixed_asset', 'Service trucks and vehicles recorded at cost.'],
      ['1510', 'Equipment & Tools', 'asset', 'fixed_asset', 'Field equipment and major tools recorded at cost.'],
      ['1520', 'Furniture & Fixtures', 'asset', 'fixed_asset', 'Office furniture and fixtures recorded at cost.'],
      ['1530', 'Leasehold Improvements', 'asset', 'fixed_asset', 'Improvements to leased shop and office space.'],
      ['1590', 'Accumulated Depreciation', 'asset', 'contra_asset', 'Contra-asset for accumulated depreciation on fixed assets.'],
      ['1700', 'Security Deposits', 'asset', 'other_asset', 'Refundable deposits held by landlords and utilities.'],

      // ---- 2000-2999 Liabilities ----
      ['2000', 'Accounts Payable', 'liability', 'accounts_payable', 'Vendor obligations awaiting payment.', ids.chartAccounts.payables],
      ['2100', 'Credit Card Payable', 'liability', 'credit_card', 'Outstanding business credit card balances.'],
      ['2150', 'Accrued Liabilities', 'liability', 'current_liability', 'Accrued expenses not yet invoiced or paid.'],
      ['2160', 'Accrued Wages & Salaries', 'liability', 'current_liability', 'Wages and salaries earned but not yet paid.'],
      ['2200', 'Sales Tax Payable', 'liability', 'current_liability', 'Sales tax collected and owed to tax authorities.'],
      ['2300', 'Payroll Tax Payable', 'liability', 'current_liability', 'Employer payroll taxes owed to tax authorities.'],
      ['2310', 'Employee Withholdings Payable', 'liability', 'current_liability', 'Employee tax and benefit withholdings owed to third parties.'],
      ['2400', 'Customer Deposits', 'liability', 'current_liability', 'Deposits and prepayments received from customers before work begins.'],
      ['2410', 'Unearned / Deferred Revenue', 'liability', 'other_current_liability', 'Amounts billed or collected in advance of service delivery.'],
      ['2500', 'Current Portion of Long-Term Debt', 'liability', 'current_liability', 'Principal on long-term debt due within twelve months.'],
      ['2700', 'Notes Payable', 'liability', 'long_term_liability', 'Long-term notes and loans payable.'],
      ['2710', 'Equipment Loans Payable', 'liability', 'long_term_liability', 'Long-term financing on equipment purchases.'],
      ['2720', 'Vehicle Loans Payable', 'liability', 'long_term_liability', 'Long-term financing on vehicle purchases.'],

      // ---- 3000-3999 Equity ----
      ['3000', "Owner's Capital", 'equity', 'equity', 'Owner capital contributions and invested funds.'],
      ['3100', "Owner's Draws", 'equity', 'contra_equity', 'Contra-equity for owner withdrawals and distributions.'],
      ['3200', 'Common Stock / Member Equity', 'equity', 'equity', 'Par value of issued stock or member equity interests.'],
      ['3300', 'Retained Earnings', 'equity', 'equity', 'Cumulative net income retained in the business.'],
      ['3900', 'Opening Balance Equity', 'equity', 'equity', 'Offsetting equity used when entering opening balances.'],

      // ---- 4000-4999 Income ----
      ['4000', 'Service Income', 'income', 'operating_revenue', 'Revenue from labor and on-site service work.'],
      ['4100', 'Service Revenue', 'income', 'operating_revenue', 'Operating revenue from service delivery.', ids.chartAccounts.serviceRevenue],
      ['4200', 'Installation Income', 'income', 'operating_revenue', 'Revenue from new equipment installation projects.'],
      ['4300', 'Maintenance Contract Income', 'income', 'operating_revenue', 'Recurring revenue from maintenance and service agreements.'],
      ['4400', 'Materials Resale Income', 'income', 'operating_revenue', 'Revenue from parts and materials billed to customers.'],
      ['4500', 'Finance Charge Income', 'income', 'other_income', 'Late fees and finance charges billed to customers.'],
      ['4900', 'Other Income', 'income', 'other_income', 'Miscellaneous operating income not classified elsewhere.'],
      ['4910', 'Discounts Given', 'income', 'contra_revenue', 'Contra-revenue for discounts granted to customers.'],
      ['4920', 'Refunds & Returns', 'income', 'contra_revenue', 'Contra-revenue for customer refunds and returned work.'],

      // ---- 5000-5999 Cost of Services (COGS) ----
      ['5000', 'Materials & Supplies', 'expense', 'cogs', 'Direct materials and parts consumed on jobs.'],
      ['5050', 'Subcontractor / Contract Labor', 'expense', 'cogs', 'Payments to subcontractors for job work.'],
      ['5100', 'Direct Labor', 'expense', 'cogs', 'Field labor wages directly attributable to jobs.'],
      ['5150', 'Equipment Rental', 'expense', 'cogs', 'Short-term equipment rental for specific jobs.'],
      ['5160', 'Job Supplies', 'expense', 'cogs', 'Consumable supplies used on job sites.'],
      ['5170', 'Vehicle Fuel - Jobs', 'expense', 'cogs', 'Fuel for service vehicles attributable to jobs.'],
      ['5180', 'Merchant Processing Fees - Jobs', 'expense', 'cogs', 'Card processing fees tied to customer job payments.'],
      ['5190', 'Warranty & Rework Costs', 'expense', 'cogs', 'Costs of warranty service and job rework.'],
      // The two original expense accounts below pre-date this expansion and keep
      // their fixed ids/codes; though they sit in the 5xxx band they are
      // genuinely operating expenses, so sub_type reflects that intent.
      ['5200', 'Software & Subscriptions', 'expense', 'operating_expense', 'Recurring software and SaaS charges.', ids.chartAccounts.softwareExpense],
      ['5300', 'Marketing Expense', 'expense', 'operating_expense', 'Paid media and campaign spend.', ids.chartAccounts.marketingExpense],

      // ---- 6000-7999 Operating Expenses ----
      ['6000', 'Advertising & Marketing', 'expense', 'operating_expense', 'Advertising, promotions, and brand marketing.'],
      ['6050', 'Bank & Processing Fees', 'expense', 'operating_expense', 'Bank service charges and merchant processing fees.'],
      ['6100', 'Dues & Subscriptions', 'expense', 'operating_expense', 'Trade association dues and business subscriptions.'],
      ['6150', 'Insurance - General Liability', 'expense', 'operating_expense', 'General liability and property insurance premiums.'],
      ['6160', 'Insurance - Workers Compensation', 'expense', 'operating_expense', 'Workers compensation insurance premiums.'],
      ['6200', 'Licenses & Permits', 'expense', 'operating_expense', 'Business licenses, trade permits, and registrations.'],
      ['6250', 'Office Supplies', 'expense', 'operating_expense', 'Office and administrative supplies.'],
      ['6300', 'Wages & Salaries - Admin', 'expense', 'operating_expense', 'Administrative and office payroll (non-job labor).'],
      ['6350', 'Payroll Taxes', 'expense', 'operating_expense', 'Employer share of payroll taxes.'],
      ['6400', 'Employee Benefits', 'expense', 'operating_expense', 'Health, retirement, and other employee benefits.'],
      ['6450', 'Rent & Lease', 'expense', 'operating_expense', 'Rent and lease of shop, office, and yard space.'],
      ['6500', 'Repairs & Maintenance', 'expense', 'operating_expense', 'Repairs and upkeep of facilities and equipment.'],
      ['6600', 'Telephone & Internet', 'expense', 'operating_expense', 'Phone, mobile, and internet service.'],
      ['6650', 'Travel', 'expense', 'operating_expense', 'Business travel, lodging, and airfare.'],
      ['6660', 'Meals & Entertainment', 'expense', 'operating_expense', 'Business meals and entertainment.'],
      ['6700', 'Utilities', 'expense', 'operating_expense', 'Electricity, gas, water, and waste for facilities.'],
      ['6750', 'Vehicle Expenses', 'expense', 'operating_expense', 'Fuel, maintenance, and registration for general vehicle use.'],
      ['6800', 'Depreciation Expense', 'expense', 'operating_expense', 'Periodic depreciation of fixed assets.'],
      ['6850', 'Professional Fees', 'expense', 'operating_expense', 'Legal, accounting, and consulting fees.'],
      ['6900', 'Training & Education', 'expense', 'operating_expense', 'Employee training and skills development.'],
      ['6950', 'Uniforms', 'expense', 'operating_expense', 'Employee uniforms and branded apparel.'],
      ['7000', 'Small Tools & Equipment', 'expense', 'operating_expense', 'Small tools and equipment expensed when purchased.'],
      ['7050', 'Continuing Education & Certifications', 'expense', 'operating_expense', 'License renewals, certifications, and continuing education.'],
      ['7100', 'Postage & Shipping', 'expense', 'operating_expense', 'Postage, courier, and shipping costs.'],
      ['7900', 'Miscellaneous Expense', 'expense', 'operating_expense', 'Other operating expenses not classified elsewhere.'],

      // ---- 8000-9999 Other Income / Expense ----
      ['8000', 'Interest Income', 'income', 'other_income', 'Interest earned on bank and savings balances.'],
      ['8100', 'Gain on Disposal of Assets', 'income', 'other_income', 'Gains on the sale or disposal of fixed assets.'],
      ['9000', 'Interest Expense', 'expense', 'other_expense', 'Interest on loans, notes, and credit lines.'],
      ['9100', 'Loss on Disposal of Assets', 'expense', 'other_expense', 'Losses on the sale or disposal of fixed assets.'],
      ['9200', 'Income Tax Expense', 'expense', 'other_expense', 'Federal, state, and local income taxes.'],
    ];
    const chartAccountRows = chartAccountDefs.map(
      ([code, name, type, subType, description, fixedId]) => ({
        id: fixedId ?? coaId(coaSeq++),
        code,
        name,
        type,
        sub_type: subType,
        description,
        is_active: true,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      }),
    );
    for (const row of chartAccountRows) {
      await upsertById('chart_of_accounts', row);
    }

    const journalEntryRows = [
      {
        id: ids.journalEntries.invoicePayment,
        entry_number: 'JE-2026-001',
        description: 'Customer receipt for Northside Plaza invoice.',
        entry_date: new Date('2026-05-27T00:00:00.000Z'),
        total_debits: '12450.00',
        total_credits: '12450.00',
        source_module: 'payments',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.journalEntries.payoutBatch,
        entry_number: 'JE-2026-002',
        description: 'Stripe payout batch deposit.',
        entry_date: new Date('2026-05-27T00:00:00.000Z'),
        total_debits: '8920.00',
        total_credits: '8920.00',
        source_module: 'bank_transactions',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.journalEntries.alliedBillPayment,
        entry_number: 'JE-2026-003',
        description: 'Vendor payment for Allied Supply.',
        entry_date: new Date('2026-06-01T00:00:00.000Z'),
        total_debits: '4280.00',
        total_credits: '4280.00',
        source_module: 'bills',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.journalEntries.metroBillPayment,
        entry_number: 'JE-2026-004',
        description: 'Vendor payment for Metro Logistics.',
        entry_date: new Date('2026-05-24T00:00:00.000Z'),
        total_debits: '920.00',
        total_credits: '920.00',
        source_module: 'bills',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.journalEntries.adobeExpense,
        entry_number: 'JE-2026-005',
        description: 'Adobe subscription expense booked from card activity.',
        entry_date: new Date('2026-05-26T00:00:00.000Z'),
        total_debits: '5999.00',
        total_credits: '5999.00',
        source_module: 'expenses',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.journalEntries.googleAdsExpense,
        entry_number: 'JE-2026-006',
        description: 'Google Ads spend booked from marketing card activity.',
        entry_date: new Date('2026-05-26T00:00:00.000Z'),
        total_debits: '1240.00',
        total_credits: '1240.00',
        source_module: 'bank_transactions',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of journalEntryRows) {
      await upsertById('journal_entries', row);
    }

    const journalEntryLineRows = [
      {
        journal_entry_id: ids.journalEntries.invoicePayment,
        account_id: ids.chartAccounts.cash,
        debit: '12450.00',
        credit: '0.00',
        description: 'Deposit received from customer.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.invoicePayment,
        account_id: ids.chartAccounts.serviceRevenue,
        debit: '0.00',
        credit: '12450.00',
        description: 'Recognize service revenue.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.payoutBatch,
        account_id: ids.chartAccounts.cash,
        debit: '8920.00',
        credit: '0.00',
        description: 'Stripe payout deposit.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.payoutBatch,
        account_id: ids.chartAccounts.clearing,
        debit: '0.00',
        credit: '8920.00',
        description: 'Clear merchant payout receivable.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.alliedBillPayment,
        account_id: ids.chartAccounts.payables,
        debit: '4280.00',
        credit: '0.00',
        description: 'Reduce accounts payable.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.alliedBillPayment,
        account_id: ids.chartAccounts.cash,
        debit: '0.00',
        credit: '4280.00',
        description: 'Pay vendor from operating cash.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.metroBillPayment,
        account_id: ids.chartAccounts.payables,
        debit: '920.00',
        credit: '0.00',
        description: 'Reduce accounts payable.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.metroBillPayment,
        account_id: ids.chartAccounts.cash,
        debit: '0.00',
        credit: '920.00',
        description: 'Pay vendor from operating cash.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.adobeExpense,
        account_id: ids.chartAccounts.softwareExpense,
        debit: '5999.00',
        credit: '0.00',
        description: 'Record software subscription expense.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.adobeExpense,
        account_id: ids.chartAccounts.clearing,
        debit: '0.00',
        credit: '5999.00',
        description: 'Offset card clearing liability.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.googleAdsExpense,
        account_id: ids.chartAccounts.marketingExpense,
        debit: '1240.00',
        credit: '0.00',
        description: 'Record paid media expense.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        journal_entry_id: ids.journalEntries.googleAdsExpense,
        account_id: ids.chartAccounts.clearing,
        debit: '0.00',
        credit: '1240.00',
        description: 'Offset card clearing liability.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of journalEntryLineRows) {
      await upsertById('journal_entry_lines', row);
    }

    const bankMerchantRows = [
      {
        id: ids.bankMerchants.stripe,
        display_name: 'Stripe',
        normalized_name: 'stripe',
        domain: 'stripe.com',
        avatar_initials: 'ST',
        avatar_color: '#635bff',
      },
      {
        id: ids.bankMerchants.adobe,
        display_name: 'Adobe',
        normalized_name: 'adobe',
        domain: 'adobe.com',
        avatar_initials: 'AD',
        avatar_color: '#ff0000',
      },
      {
        id: ids.bankMerchants.googleAds,
        display_name: 'Google Ads',
        normalized_name: 'google ads',
        domain: 'google.com',
        avatar_initials: 'GG',
        avatar_color: '#4285f4',
      },
      {
        id: ids.bankMerchants.twilio,
        display_name: 'Twilio',
        normalized_name: 'twilio',
        domain: 'twilio.com',
        avatar_initials: 'TW',
        avatar_color: '#f22f46',
      },
    ];
    for (const row of bankMerchantRows) {
      await upsertById('bank_merchants', row);
    }

    const bankCardRows = [
      {
        id: ids.bankCards.operations,
        card_name: 'Operations Card',
        last4: '4242',
        provider: 'mercury',
        provider_card_id: 'card_operations_4242',
        vendor_id: ids.organizations.alliedSupply,
        bank_account_id: ids.bankAccounts.cardClearing,
        status: 'active',
        card_type: 'business',
        network: 'visa',
        daily_limit: '2500.00',
        per_transaction_limit: '1200.00',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bankCards.marketing,
        card_name: 'Marketing Card',
        last4: '1212',
        provider: 'mercury',
        provider_card_id: 'card_marketing_1212',
        vendor_id: ids.organizations.metroLogistics,
        bank_account_id: ids.bankAccounts.cardClearing,
        status: 'active',
        card_type: 'business',
        network: 'mastercard',
        daily_limit: '1500.00',
        per_transaction_limit: '750.00',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of bankCardRows) {
      await upsertById('bank_cards', row);
    }

    const bankTransactionRows = [
      {
        id: ids.bankTransactions.income1,
        bank_account_id: ids.bankAccounts.operating,
        merchant_id: ids.bankMerchants.stripe,
        provider: 'mercury',
        provider_transaction_id: 'txn_demo_001',
        provider_status: 'posted',
        provider_kind: 'card_payment',
        counterparty_name: 'Acme Corp',
        posted_at: now,
        transaction_date: new Date('2026-05-27T00:00:00.000Z'),
        amount: '12450.00',
        transaction_type: 'deposit',
        description: 'Invoice #4821 payment',
        reference: 'INV-4821',
        external_category: 'income',
        internal_category: 'receipts',
        category_source: 'manual',
        status: 'reconciled',
        rule_resolution_status: 'processed',
        llm_review_status: 'not_requested',
        journal_entry_id: ids.journalEntries.invoicePayment,
        notes: 'Seeded cash receipt',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bankTransactions.income2,
        bank_account_id: ids.bankAccounts.operating,
        merchant_id: ids.bankMerchants.stripe,
        provider: 'mercury',
        provider_transaction_id: 'txn_demo_002',
        provider_status: 'posted',
        provider_kind: 'payout',
        counterparty_name: 'Stripe',
        posted_at: now,
        transaction_date: new Date('2026-05-27T00:00:00.000Z'),
        amount: '8920.00',
        transaction_type: 'deposit',
        description: 'Payout batch May 26',
        reference: 'PAYOUT-0526',
        external_category: 'income',
        internal_category: 'receipts',
        category_source: 'manual',
        status: 'categorized',
        rule_resolution_status: 'processed',
        llm_review_status: 'not_requested',
        journal_entry_id: ids.journalEntries.payoutBatch,
        notes: 'Seeded payout',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bankTransactions.expense1,
        bank_account_id: ids.bankAccounts.cardClearing,
        card_id: ids.bankCards.operations,
        merchant_id: ids.bankMerchants.adobe,
        provider: 'mercury',
        provider_transaction_id: 'txn_demo_003',
        provider_status: 'posted',
        provider_kind: 'card_charge',
        counterparty_name: 'Adobe',
        posted_at: now,
        transaction_date: new Date('2026-05-26T00:00:00.000Z'),
        amount: '-5999.00',
        transaction_type: 'withdrawal',
        description: 'Creative Cloud subscription',
        reference: 'ADOBE-CC',
        external_category: 'software',
        internal_category: 'subscriptions',
        category_source: 'manual',
        status: 'pending',
        rule_resolution_status: 'unprocessed',
        llm_review_status: 'not_requested',
        journal_entry_id: ids.journalEntries.adobeExpense,
        notes: 'Seeded SaaS expense',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bankTransactions.expense2,
        bank_account_id: ids.bankAccounts.cardClearing,
        card_id: ids.bankCards.marketing,
        merchant_id: ids.bankMerchants.googleAds,
        provider: 'mercury',
        provider_transaction_id: 'txn_demo_004',
        provider_status: 'posted',
        provider_kind: 'card_charge',
        counterparty_name: 'Google Ads',
        posted_at: now,
        transaction_date: new Date('2026-05-26T00:00:00.000Z'),
        amount: '-1240.00',
        transaction_type: 'fee',
        description: 'Campaign spend - May',
        reference: 'ADS-MAY',
        external_category: 'marketing',
        internal_category: 'ads',
        category_source: 'manual',
        status: 'pending',
        rule_resolution_status: 'unprocessed',
        llm_review_status: 'not_requested',
        journal_entry_id: ids.journalEntries.googleAdsExpense,
        notes: 'Seeded ad spend',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of bankTransactionRows) {
      await upsertById('bank_transactions', row);
    }

    const billRows = [
      {
        id: ids.bills.allied,
        bill_number: 'BILL-2026-001',
        vendor_id: ids.organizations.alliedSupply,
        vendor_name: 'Allied Supply',
        issue_date: new Date('2026-05-20T00:00:00.000Z'),
        due_date: new Date('2026-06-03T00:00:00.000Z'),
        status: 'pending',
        subtotal: '3920.00',
        tax_amount: '360.00',
        total_amount: '4280.00',
        amount_paid: '0.00',
        notes: 'Copper fittings and valves',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bills.north,
        bill_number: 'BILL-2026-002',
        vendor_id: ids.organizations.metroLogistics,
        vendor_name: 'Metro Logistics',
        issue_date: new Date('2026-05-18T00:00:00.000Z'),
        due_date: new Date('2026-05-30T00:00:00.000Z'),
        status: 'paid',
        subtotal: '900.00',
        tax_amount: '20.00',
        total_amount: '920.00',
        amount_paid: '920.00',
        notes: 'Fleet service and toll pass',
        paid_at: new Date('2026-05-24T00:00:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of billRows) {
      await upsertById('bills', row);
    }

    const paymentRows = [
      {
        id: ids.payments.bill1,
        payment_number: 'PAY-2026-001',
        bill_id: ids.bills.allied,
        organization_id: ids.organizations.alliedSupply,
        amount: '4280.00',
        payment_date: new Date('2026-06-01T00:00:00.000Z'),
        method: 'bank_transfer',
        reference: 'ACH-4280',
        payment_direction: 'outgoing',
        reconciliation_status: 'pending',
        journal_entry_id: ids.journalEntries.alliedBillPayment,
        notes: 'Queued payment for Allied Supply',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.payments.bill2,
        payment_number: 'PAY-2026-002',
        bill_id: ids.bills.north,
        organization_id: ids.organizations.metroLogistics,
        amount: '920.00',
        payment_date: new Date('2026-05-24T00:00:00.000Z'),
        method: 'bank_transfer',
        reference: 'ACH-920',
        payment_direction: 'outgoing',
        reconciliation_status: 'reconciled',
        journal_entry_id: ids.journalEntries.metroBillPayment,
        notes: 'Processed payment for Metro Logistics',
        paid_at: new Date('2026-05-24T00:00:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of paymentRows) {
      await upsertById('payments', row);
    }

    const expenseRows = [
      {
        id: ids.expenses.adobe,
        expense_number: 'EXP-2026-001',
        vendor_id: ids.organizations.metroLogistics,
        amount: '5999.00',
        expense_date: new Date('2026-05-26T00:00:00.000Z'),
        category: 'software',
        description: 'Creative Cloud subscription',
        journal_entry_id: ids.journalEntries.adobeExpense,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.expenses.metro,
        expense_number: 'EXP-2026-002',
        vendor_id: ids.organizations.metroLogistics,
        amount: '1240.00',
        expense_date: new Date('2026-05-26T00:00:00.000Z'),
        category: 'marketing',
        description: 'Google Ads campaign spend',
        journal_entry_id: ids.journalEntries.googleAdsExpense,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of expenseRows) {
      await upsertById('expenses', row);
    }

    // -------------------------------------------------------------------------
    // Scheduling / Calendar demo data: services, an estimate (so confirming a
    // booking can auto-seed a work order from the latest estimate), booking
    // links of each kind, availability rules across every overlay layer, and
    // bookings in varied statuses so the calendar grid shows real events.
    // -------------------------------------------------------------------------
    const serviceRows = [
      {
        id: ids.services.hvacTuneup,
        name: 'HVAC Tune-Up',
        description: 'Seasonal inspection and maintenance for residential HVAC systems.',
        category: 'hvac',
        estimated_duration_minutes: 60,
        suggested_price: '189.00',
        is_active: true,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.services.consult,
        name: 'On-site Consult',
        description: 'Walkthrough and scope estimate for new projects.',
        category: 'general',
        estimated_duration_minutes: 45,
        suggested_price: '0.00',
        is_active: true,
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of serviceRows) {
      await upsertById('services', row);
    }

    await upsertById('estimates', {
      id: ids.estimates.averyRetrofit,
      estimate_number: 'EST-2026-0001',
      version_number: 1,
      contact_id: ids.contacts.avery,
      contact_name: 'Avery Kim',
      organization_id: ids.organizations.northside,
      organization_name: 'Northside Plaza',
      title: 'Northside HVAC Retrofit',
      description: 'Replacement of two rooftop units and ductwork cleaning.',
      line_items: [
        { description: 'Rooftop unit (3 ton)', quantity: 2, unitPrice: 5200, total: 10400 },
        { description: 'Duct cleaning', quantity: 1, unitPrice: 1800, total: 1800 },
      ],
      subtotal: '12200.00',
      total_amount: '12200.00',
      status: 'accepted',
      accepted_at: new Date('2026-05-30T17:00:00.000Z'),
      created_by: ids.users.admin,
      updated_by: ids.users.admin,
    });

    const bookingLinkRows = [
      {
        id: ids.bookingLinks.consult,
        name: 'On-site Consult',
        slug: 'on-site-consult',
        public_token: 'tok_consult_0000000000000000000001',
        link_kind: 'standard',
        is_active: true,
        service_id: ids.services.consult,
        duration_minutes: 45,
        channel: 'on-site',
        fields_to_collect: [
          { key: 'name', label: 'Full name', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'phone', label: 'Phone', type: 'tel', required: false },
          { key: 'address', label: 'Service address', type: 'text', required: true },
        ],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bookingLinks.averyPersonalized,
        name: 'Avery — HVAC Tune-Up',
        slug: 'avery-hvac-tuneup',
        public_token: 'tok_avery_00000000000000000000001',
        link_kind: 'personalized',
        is_active: true,
        service_id: ids.services.hvacTuneup,
        contact_id: ids.contacts.avery,
        duration_minutes: 60,
        channel: 'on-site',
        known_data: { name: 'Avery Kim', email: 'avery@northside-plaza.example', phone: '+1 (512) 555-0110' },
        fields_to_collect: [
          { key: 'address', label: 'Service address', type: 'text', required: true },
          { key: 'notes', label: 'Anything we should know?', type: 'textarea', required: false },
        ],
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bookingLinks.jordanConfirm,
        name: 'Confirm: Oakridge visit',
        slug: 'confirm-oakridge-visit',
        public_token: 'tok_confirm_000000000000000000001',
        link_kind: 'confirmation',
        is_active: true,
        service_id: ids.services.consult,
        contact_id: ids.contacts.jordan,
        duration_minutes: 45,
        channel: 'on-site',
        known_data: { name: 'Jordan Pike', email: 'jpike@oakridge-hoa.example' },
        fields_to_collect: [
          { key: 'notes', label: 'Notes for the crew', type: 'textarea', required: false },
        ],
        proposed_slots: [
          { startsAt: '2026-06-04T19:00:00.000Z', endsAt: '2026-06-04T19:45:00.000Z' },
          { startsAt: '2026-06-05T15:00:00.000Z', endsAt: '2026-06-05T15:45:00.000Z' },
        ],
        expires_at: new Date('2026-06-10T00:00:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of bookingLinkRows) {
      await upsertById('booking_links', row);
    }

    const availabilityRuleRows = [
      // Business hours (owner/admin published) Mon–Wed.
      {
        id: ids.availabilityRules.businessMon,
        subject_kind: 'business',
        business_id: ids.business,
        layer_key: 'business',
        availability_type: 'recurring',
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.availabilityRules.businessTue,
        subject_kind: 'business',
        business_id: ids.business,
        layer_key: 'business',
        availability_type: 'recurring',
        day_of_week: 2,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.availabilityRules.businessWed,
        subject_kind: 'business',
        business_id: ids.business,
        layer_key: 'business',
        availability_type: 'recurring',
        day_of_week: 3,
        start_time: '09:00:00',
        end_time: '16:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      // A contractor's own published availability (contact subject, contractor layer).
      {
        id: ids.availabilityRules.contractorMon,
        subject_kind: 'contact',
        contact_id: ids.contacts.avery,
        layer_key: 'contractor',
        availability_type: 'recurring',
        day_of_week: 1,
        start_time: '08:00:00',
        end_time: '12:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        notes: 'Mornings only on Mondays.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      // Owner blocked a specific date (e.g. holiday).
      {
        id: ids.availabilityRules.ownerBlocked,
        subject_kind: 'user',
        user_id: ids.users.admin,
        layer_key: 'owner',
        availability_type: 'blocked',
        specific_date: new Date('2026-06-05T00:00:00.000Z'),
        is_available: false,
        is_published: true,
        timezone: 'America/Chicago',
        notes: 'Out of office.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      // Service-level bookable window.
      {
        id: ids.availabilityRules.serviceWindow,
        subject_kind: 'service',
        service_id: ids.services.hvacTuneup,
        layer_key: 'service',
        availability_type: 'recurring',
        day_of_week: 4,
        start_time: '10:00:00',
        end_time: '15:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      // A contact's preferred window (contact layer).
      {
        id: ids.availabilityRules.contactPref,
        subject_kind: 'contact',
        contact_id: ids.contacts.jordan,
        layer_key: 'contact',
        availability_type: 'recurring',
        day_of_week: 5,
        start_time: '13:00:00',
        end_time: '17:00:00',
        is_available: true,
        is_published: true,
        timezone: 'America/Chicago',
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
    ];
    for (const row of availabilityRuleRows) {
      await upsertById('availability_rules', row);
    }

    const bookingRows = [
      {
        id: ids.bookings.confirmed,
        contact_id: ids.contacts.avery,
        service_id: ids.services.hvacTuneup,
        status: 'confirmed',
        source: 'admin',
        booking_date: new Date('2026-06-03T00:00:00.000Z'),
        start_time: '15:00:00',
        end_time: '16:00:00',
        starts_at: new Date('2026-06-03T20:00:00.000Z'),
        ends_at: new Date('2026-06-03T21:00:00.000Z'),
        duration_minutes: 60,
        notes: 'Confirmed tune-up visit.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bookings.pending,
        contact_id: ids.contacts.jordan,
        service_id: ids.services.consult,
        booking_link_id: ids.bookingLinks.jordanConfirm,
        status: 'pending_customer',
        source: 'booking_link',
        booking_date: new Date('2026-06-04T00:00:00.000Z'),
        start_time: '14:00:00',
        end_time: '14:45:00',
        starts_at: new Date('2026-06-04T19:00:00.000Z'),
        ends_at: new Date('2026-06-04T19:45:00.000Z'),
        duration_minutes: 45,
        notes: 'Awaiting customer confirmation.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.bookings.unconfirmed,
        contact_id: ids.contacts.mara,
        service_id: ids.services.consult,
        status: 'unconfirmed',
        source: 'admin',
        booking_date: new Date('2026-06-04T00:00:00.000Z'),
        start_time: '10:00:00',
        end_time: '10:45:00',
        starts_at: new Date('2026-06-04T15:00:00.000Z'),
        ends_at: new Date('2026-06-04T15:45:00.000Z'),
        duration_minutes: 45,
        notes: 'Tentative hold.',
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.bookings.draft,
        contact_id: ids.contacts.avery,
        service_id: ids.services.hvacTuneup,
        status: 'draft',
        source: 'admin',
        booking_date: new Date('2026-06-05T00:00:00.000Z'),
        start_time: '11:00:00',
        end_time: '12:00:00',
        starts_at: new Date('2026-06-05T16:00:00.000Z'),
        ends_at: new Date('2026-06-05T17:00:00.000Z'),
        duration_minutes: 60,
        notes: 'Draft slot from drag-create.',
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of bookingRows) {
      await upsertById('bookings', row);
    }

    const changeLogRows = [
      {
        id: ids.changeLog.orgCreate,
        table_name: 'organizations',
        record_id: ids.organizations.northside,
        action: 'create',
        user_id: ids.users.admin,
        changes: { name: 'Northside Plaza', relationshipType: 'customer' },
        metadata: { section: 'organizations', recordTitle: 'Northside Plaza', source: 'admin' },
        created_at: new Date('2026-05-24T14:05:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.changeLog.leadCreate,
        table_name: 'leads',
        record_id: ids.leads.northside,
        action: 'create',
        user_id: ids.users.manager,
        changes: { name: 'Northside HVAC Retrofit', status: 'new' },
        metadata: { section: 'leads', recordTitle: 'Northside HVAC Retrofit', source: 'admin' },
        created_at: new Date('2026-05-25T09:32:00.000Z'),
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.changeLog.leadUpdate,
        table_name: 'leads',
        record_id: ids.leads.oakridge,
        action: 'update',
        user_id: ids.users.operator,
        changes: { status: { from: 'new', to: 'qualified' } },
        metadata: { section: 'leads', recordTitle: 'Oakridge Comfort Plan', source: 'admin' },
        created_at: new Date('2026-05-25T16:48:00.000Z'),
        created_by: ids.users.operator,
        updated_by: ids.users.operator,
      },
      {
        id: ids.changeLog.billCreate,
        table_name: 'bills',
        record_id: ids.bills.allied,
        action: 'create',
        user_id: ids.users.admin,
        changes: { billNumber: 'BILL-2026-001', vendorName: 'Allied Supply', totalAmount: '4280.00' },
        metadata: { section: 'bills', recordTitle: 'BILL-2026-001', source: 'admin' },
        created_at: new Date('2026-05-26T10:15:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
      {
        id: ids.changeLog.paymentUpdate,
        table_name: 'payments',
        record_id: ids.payments.bill2,
        action: 'update',
        user_id: ids.users.manager,
        changes: { reconciliationStatus: { from: 'pending', to: 'reconciled' } },
        metadata: { section: 'payments', recordTitle: 'PAY-2026-002', source: 'admin' },
        created_at: new Date('2026-05-26T17:20:00.000Z'),
        created_by: ids.users.manager,
        updated_by: ids.users.manager,
      },
      {
        id: ids.changeLog.bankAutomation,
        table_name: 'bank_transactions',
        record_id: ids.bankTransactions.expense1,
        action: 'automation',
        user_id: null,
        changes: { category: { from: null, to: 'software' } },
        metadata: { recordTitle: 'Adobe Creative Cloud', source: 'bank-rules', rule: 'Auto-categorize SaaS vendors' },
        created_at: new Date('2026-05-27T03:00:00.000Z'),
      },
      {
        id: ids.changeLog.contactCreate,
        table_name: 'contacts',
        record_id: ids.contacts.mara,
        action: 'create',
        user_id: ids.users.operator,
        changes: { name: 'Mara Quinn', type: 'customer' },
        metadata: { section: 'contacts', recordTitle: 'Mara Quinn', source: 'admin' },
        created_at: new Date('2026-05-27T11:42:00.000Z'),
        created_by: ids.users.operator,
        updated_by: ids.users.operator,
      },
      {
        id: ids.changeLog.estimateDelete,
        table_name: 'estimates',
        record_id: rfc4122SeedUuid('cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdff'),
        action: 'delete',
        user_id: ids.users.admin,
        changes: { status: { from: 'draft', to: null } },
        metadata: { section: 'estimates', recordTitle: 'EST-2026-014 (duplicate)', source: 'admin' },
        created_at: new Date('2026-05-28T08:10:00.000Z'),
        created_by: ids.users.admin,
        updated_by: ids.users.admin,
      },
    ];
    for (const row of changeLogRows) {
      await upsertById('change_log', row);
    }

    await client.query('COMMIT');

    console.log('Seed complete. Demo data is available for users, CRM, finance, banking, and calendar pages.');
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
