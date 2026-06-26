#!/usr/bin/env node
/**
 * sql-to-prisma.mjs
 *
 * Pragmatic Postgres-DDL → Prisma converter for Proto-1's schema.sql.
 *
 * It is intentionally narrow:
 *   - It supports the subset of DDL actually used by Proto-1 (CREATE TABLE,
 *     CREATE INDEX, ALTER TABLE ADD CONSTRAINT for FKs, CONSTRAINT UNIQUE).
 *   - CHECK constraints become inline comments (`/// CHECK ...`) — Prisma
 *     enums are not auto-emitted because the same value-spaces overlap and
 *     duplicating them creates conflicts. Application-level validation
 *     (zod / class-validator) is where these are enforced going forward.
 *   - Polymorphic columns (`*_type`/`*_id` pairs) stay as plain scalars,
 *     mirroring Laravel morphTo. Annotated with a `/// morphTo` comment.
 *
 * Source-of-truth: Proto-1/schema.sql
 * Output:          prisma/schema.prisma
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const SRC = process.argv[2] ?? '/Users/grant/Desktop/APP-LAB/Proto-1/schema.sql';
const OUT = process.argv[3] ?? resolve(process.cwd(), 'prisma/schema.prisma');

let sql = readFileSync(SRC, 'utf8');

// Strip SQL line comments (-- ... end-of-line). Inline comments inside CREATE
// TABLE bodies otherwise confuse the column parser.
sql = sql
  .split('\n')
  .map((line) => {
    // preserve lines that start with -- (full-line comments) by deleting them
    const idx = line.indexOf('--');
    if (idx === -1) return line;
    // Naive: if the -- is not inside a quoted string, drop the rest.
    // We don't currently emit string literals containing `--` so this is safe.
    return line.slice(0, idx);
  })
  .join('\n');

// ---------------------------------------------------------------------------
// 1) Pull CREATE TABLE blocks
// ---------------------------------------------------------------------------

const tables = [];                  // [{ name, columns:[], tableConstraints:[], rawBody }]
const tableByName = new Map();

const createTableRe = /CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\n\);/g;
for (const m of sql.matchAll(createTableRe)) {
  const name = m[1];
  const body = m[2];
  const t = { name, columns: [], tableConstraints: [], indexes: [], rawBody: body };
  tables.push(t);
  tableByName.set(name, t);
}

// Split a body into top-level entries respecting parens
function splitTopLevel(body) {
  const out = [];
  let depth = 0;
  let buf = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

for (const t of tables) {
  for (const entry of splitTopLevel(t.rawBody)) {
    if (/^CONSTRAINT\s+\w+\s+UNIQUE/i.test(entry)) {
      const m = entry.match(/UNIQUE\s*\(([^)]+)\)/i);
      if (m) {
        t.tableConstraints.push({
          kind: 'unique',
          cols: m[1].split(',').map((s) => s.trim()),
        });
      }
      continue;
    }
    if (/^CONSTRAINT\s+\w+\s+CHECK/i.test(entry)) {
      t.tableConstraints.push({ kind: 'check', raw: entry });
      continue;
    }
    if (/^CONSTRAINT\s+\w+\s+FOREIGN KEY/i.test(entry)) {
      // ALTER ADD CONSTRAINT FK form sometimes appears inline. Capture.
      t.tableConstraints.push({ kind: 'fk-inline', raw: entry });
      continue;
    }
    if (/^(PRIMARY KEY|UNIQUE|CHECK)\b/i.test(entry)) {
      t.tableConstraints.push({ kind: 'raw', raw: entry });
      continue;
    }
    // Otherwise it's a column.
    const col = parseColumn(entry);
    if (col) t.columns.push(col);
  }
}

function parseColumn(entry) {
  // form: "<name> <type spec...> [NOT NULL] [DEFAULT ...] [UNIQUE] [REFERENCES ...] [CHECK (...)]"
  const m = entry.match(/^(\w+)\s+([\s\S]+)$/);
  if (!m) return null;
  const name = m[1];
  let rest = m[2];

  let pk = false;
  let notNull = false;
  let unique = false;
  let defaultExpr = null;
  let references = null; // { table, column, onDelete }
  let checkRaw = null;
  let typeSpec = rest;

  // CHECK in column
  const checkMatch = rest.match(/\bCHECK\s*\(([\s\S]+)\)\s*$/i);
  if (checkMatch) {
    checkRaw = checkMatch[1].trim();
    typeSpec = rest.slice(0, checkMatch.index).trim();
    rest = typeSpec;
  }

  // REFERENCES
  const refMatch = rest.match(/REFERENCES\s+(\w+)\s*\((\w+)\)(?:\s+ON DELETE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION))?/i);
  if (refMatch) {
    references = { table: refMatch[1], column: refMatch[2], onDelete: (refMatch[3] || '').toUpperCase() };
    typeSpec = rest.slice(0, refMatch.index).trim();
    rest = typeSpec;
  }

  // PRIMARY KEY
  if (/PRIMARY KEY/i.test(rest)) {
    pk = true;
    rest = rest.replace(/PRIMARY KEY/i, '').trim();
    typeSpec = rest;
  }
  if (/UNIQUE/i.test(rest)) {
    unique = true;
    rest = rest.replace(/UNIQUE/i, '').trim();
    typeSpec = rest;
  }

  // DEFAULT
  const defMatch = rest.match(/DEFAULT\s+([\s\S]+?)(?:\s+NOT NULL|\s+UNIQUE|\s+REFERENCES|\s*$)/i);
  if (defMatch) {
    defaultExpr = defMatch[1].trim().replace(/\s+NOT NULL\s*$/i, '').trim();
    rest = rest.slice(0, defMatch.index) + rest.slice(defMatch.index + defMatch[0].length);
    rest = rest.trim();
    typeSpec = rest;
  }

  if (/NOT NULL/i.test(rest)) {
    notNull = true;
    rest = rest.replace(/NOT NULL/i, '').trim();
    typeSpec = rest;
  }

  typeSpec = rest.trim().replace(/,\s*$/, '');

  return { name, typeSpec, pk, notNull, unique, defaultExpr, references, checkRaw };
}

// ---------------------------------------------------------------------------
// 2) Pull ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... (for late FKs)
// ---------------------------------------------------------------------------

const alterFkRe =
  /ALTER TABLE\s+(\w+)\s+([\s\S]*?);/g;

for (const m of sql.matchAll(alterFkRe)) {
  const tableName = m[1];
  const body = m[2];
  const t = tableByName.get(tableName);
  if (!t) continue;
  const fkRe = /ADD CONSTRAINT\s+\w+\s+FOREIGN KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)(?:\s+ON DELETE\s+(CASCADE|SET NULL|RESTRICT|NO ACTION))?/gi;
  for (const fk of body.matchAll(fkRe)) {
    const col = t.columns.find((c) => c.name === fk[1]);
    if (col && !col.references) {
      col.references = { table: fk[2], column: fk[3], onDelete: (fk[4] || '').toUpperCase() };
    }
  }
}

// ---------------------------------------------------------------------------
// 3) Pull CREATE INDEX
// ---------------------------------------------------------------------------

const indexRe = /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:CONCURRENTLY\s+)?(?:IF NOT EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)(?:\s+WHERE\s+([^;]+))?;/gi;
for (const m of sql.matchAll(indexRe)) {
  const isUnique = !!m[1];
  const tableName = m[3];
  const colsRaw = m[4];
  const where = m[5];
  const t = tableByName.get(tableName);
  if (!t) continue;
  const cols = colsRaw.split(',').map((c) => c.trim().split(/\s+/)[0]);
  t.indexes.push({ unique: isUnique, cols, where: where ? where.trim() : null });
}

// ---------------------------------------------------------------------------
// 4) Convert to Prisma
// ---------------------------------------------------------------------------

function snakeToCamel(s) {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function snakeToPascal(s) {
  const cc = snakeToCamel(s);
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}
function modelName(tableName) {
  // singularize trailing 's' for most table names; preserve plurality otherwise
  const irregulars = {
    settings: 'Setting',
    addresses: 'Address',
    inventory: 'Inventory',
    contractor_availability: 'ContractorAvailability',
    safety_incidents: 'SafetyIncident',
    quality_reviews: 'QualityReview',
    contractor_performance: 'ContractorPerformance',
    contracts: 'Contract',
    bills: 'Bill',
    estimates: 'Estimate',
    estimate_templates: 'EstimateTemplate',
    services: 'Service',
    products: 'Product',
    leads: 'Lead',
    bookings: 'Booking',
    booking_requests: 'BookingRequest',
    sops: 'Sop',
    service_sops: 'ServiceSop',
    work_orders: 'WorkOrder',
    work_order_materials: 'WorkOrderMaterial',
    work_order_status_history: 'WorkOrderStatusHistory',
    work_order_photos: 'WorkOrderPhoto',
    work_order_documents: 'WorkOrderDocument',
    work_order_time_logs: 'WorkOrderTimeLog',
    material_returns: 'MaterialReturn',
    material_purchases: 'MaterialPurchase',
    opportunities: 'Opportunity',
    opportunity_boards: 'OpportunityBoard',
    opportunity_board_task_pins: 'OpportunityBoardTaskPin',
    tickets: 'Ticket',
    reviews: 'Review',
  };
  if (irregulars[tableName]) return irregulars[tableName];
  const pas = snakeToPascal(tableName);
  // generic: strip trailing 's' only for plain plural endings
  if (/ies$/.test(pas)) return pas.replace(/ies$/, 'y');
  if (/sses$/.test(pas)) return pas.replace(/sses$/, 'ss');
  if (/s$/.test(pas) && !/ss$/.test(pas)) return pas.replace(/s$/, '');
  return pas;
}

function prismaScalar(typeSpec) {
  const t = typeSpec.toLowerCase().replace(/\s+/g, ' ').trim();
  if (/^uuid\b/.test(t))           return { type: 'String',   dbAttr: '@db.Uuid' };
  if (/^text\b/.test(t))           return { type: 'String',   dbAttr: '' };
  if (/^varchar\s*\((\d+)\)/.test(t)) {
    const n = t.match(/^varchar\s*\((\d+)\)/)[1];
    return { type: 'String',   dbAttr: `@db.VarChar(${n})` };
  }
  if (/^boolean\b/.test(t))        return { type: 'Boolean',  dbAttr: '' };
  if (/^bigint\b/.test(t))         return { type: 'BigInt',   dbAttr: '' };
  if (/^integer\b/.test(t))        return { type: 'Int',      dbAttr: '' };
  if (/^smallint\b/.test(t))       return { type: 'Int',      dbAttr: '@db.SmallInt' };
  if (/^numeric\s*\((\d+),\s*(\d+)\)/.test(t)) {
    const [, p, s] = t.match(/^numeric\s*\((\d+),\s*(\d+)\)/);
    return { type: 'Decimal',  dbAttr: `@db.Decimal(${p}, ${s})` };
  }
  if (/^numeric\b/.test(t))        return { type: 'Decimal',  dbAttr: '' };
  if (/^jsonb\b/.test(t))          return { type: 'Json',     dbAttr: '@db.JsonB' };
  if (/^json\b/.test(t))           return { type: 'Json',     dbAttr: '' };
  if (/^timestamptz\b/.test(t))    return { type: 'DateTime', dbAttr: '@db.Timestamptz(6)' };
  if (/^timestamp\b/.test(t))      return { type: 'DateTime', dbAttr: '@db.Timestamp(6)' };
  if (/^date\b/.test(t))           return { type: 'DateTime', dbAttr: '@db.Date' };
  if (/^time\b/.test(t))           return { type: 'DateTime', dbAttr: '@db.Time(6)' };
  if (/^bytea\b/.test(t))          return { type: 'Bytes',    dbAttr: '' };
  return { type: 'String',     dbAttr: `/* unknown SQL type: ${t} */` };
}

function defaultClause(col) {
  const d = col.defaultExpr;
  if (!d) return '';
  const t = col.typeSpec.toLowerCase();
  if (/now\(\)/i.test(d)) return '@default(now())';
  if (/gen_random_uuid\(\)/i.test(d)) return `@default(dbgenerated("gen_random_uuid()"))`;
  if (/^true$/i.test(d.trim())) return '@default(true)';
  if (/^false$/i.test(d.trim())) return '@default(false)';
  if (/^-?\d+(\.\d+)?$/.test(d.trim())) return `@default(${d.trim()})`;
  // string literal
  const sm = d.match(/^'([\s\S]*)'(?:::[\w()\s]+)?$/);
  if (sm) {
    const lit = sm[1];
    if (/jsonb|json/.test(t)) {
      return `@default(dbgenerated("'${lit.replace(/"/g, '\\"')}'::jsonb"))`;
    }
    return `@default("${lit.replace(/"/g, '\\"')}")`;
  }
  // give up — escape into dbgenerated
  return `@default(dbgenerated(${JSON.stringify(d)}))`;
}

function onDeleteAttr(onDelete) {
  if (!onDelete) return '';
  switch (onDelete) {
    case 'CASCADE':  return 'onDelete: Cascade';
    case 'SET NULL': return 'onDelete: SetNull';
    case 'RESTRICT': return 'onDelete: Restrict';
    case 'NO ACTION':return 'onDelete: NoAction';
    default: return '';
  }
}

// Build a fast lookup so we can name relation back-references uniquely if a
// model has multiple FKs to the same target (e.g. created_by/updated_by both -> users).
function emitPrisma() {
  let out = '';
  out += `// =============================================================================\n`;
  out += `// Proto-2 Prisma schema — ported verbatim from Proto-1/schema.sql\n`;
  out += `// Generated by scripts/sql-to-prisma.mjs. Re-run after Proto-1 schema changes.\n`;
  out += `//\n`;
  out += `// Postgres conventions are preserved:\n`;
  out += `//   - DB-level identifiers stay snake_case (@map / @@map)\n`;
  out += `//   - TS field names are camelCase\n`;
  out += `//   - CHECK constraints documented as inline comments (validated app-side)\n`;
  out += `// =============================================================================\n\n`;

  out += `generator client {\n`;
  out += `  provider = "prisma-client"\n`;
  out += `  output   = "../generated"\n`;
  out += `}\n\n`;

  out += `datasource db {\n`;
  out += `  provider = "postgresql"\n`;
  out += `}\n\n`;
  out += `// Connection URL is configured in prisma.config.ts (Prisma 7).\n`;
  out += `// At runtime, src/lib/prisma.ts instantiates PrismaClient with a\n`;
  out += `// PrismaPg adapter built from process.env.DATABASE_URL.\n\n`;

  // Pre-compute back-relation names. For each target model, collect (sourceModel, fkColumn) groups.
  // If a single source model has multiple FKs into one target, append the FK column to disambiguate.
  const backRels = new Map(); // key: `${targetTable}|${sourceTable}` -> [ { sourceCol, relationName } ]
  for (const t of tables) {
    for (const c of t.columns) {
      if (!c.references) continue;
      const target = c.references.table;
      const key = `${target}|${t.name}`;
      const list = backRels.get(key) ?? [];
      list.push({ sourceCol: c.name });
      backRels.set(key, list);
    }
  }

  // Disambiguate when:
  //   - multiple FKs from same source -> same target
  //   - self-relation
  //   - cross-relation: source -> target AND target -> source both exist
  //     (this creates ambiguity because the same pair of models appears twice)
  for (const [key, list] of backRels.entries()) {
    const [target, source] = key.split('|');
    const isSelf = target === source;
    const reverseExists = backRels.has(`${source}|${target}`);
    if (list.length > 1 || isSelf || reverseExists) {
      for (const e of list) {
        e.relationName = `${source}_${e.sourceCol}_${target}`;
      }
    }
  }

  for (const t of tables) {
    out += `model ${modelName(t.name)} {\n`;

    // Column → Prisma field
    for (const c of t.columns) {
      const camel = snakeToCamel(c.name);
      const scalar = prismaScalar(c.typeSpec);
      let line = `  ${camel.padEnd(36)} ${scalar.type}${c.notNull || c.pk ? '' : '?'}`;
      const attrs = [];
      if (c.pk) attrs.push('@id');
      if (c.unique && !c.pk) attrs.push('@unique');
      if (scalar.dbAttr) attrs.push(scalar.dbAttr);
      const def = defaultClause(c);
      if (def) attrs.push(def);
      if (c.name !== camel) attrs.push(`@map("${c.name}")`);
      if (attrs.length) line += '  ' + attrs.join(' ');
      if (c.checkRaw) {
        line += `  /// CHECK ${c.checkRaw.replace(/\s+/g, ' ').trim()}`;
      }
      out += line + '\n';
    }

    // Relations (owning side) — emit AFTER scalar columns
    for (const c of t.columns) {
      if (!c.references) continue;
      const camel = snakeToCamel(c.name);
      const refModel = modelName(c.references.table);
      const targetCol = snakeToCamel(c.references.column);
      const optional = !c.notNull ? '?' : '';
      const onDel = onDeleteAttr(c.references.onDelete);

      // Field name on this side: strip trailing _id from sourceCol
      let relField = camel.replace(/Id$/, '');
      if (!relField) relField = `${refModel.toLowerCase()}Ref`;

      // Conflict guard: if relField collides with another field, append _ref
      if (t.columns.some((other) => snakeToCamel(other.name) === relField)) {
        relField = relField + 'Ref';
      }

      const key = `${c.references.table}|${t.name}`;
      const grp = backRels.get(key) ?? [];
      const entry = grp.find((g) => g.sourceCol === c.name);
      const relationName = entry?.relationName;

      const parts = [`fields: [${camel}]`, `references: [${targetCol}]`];
      if (onDel) parts.push(onDel);
      if (relationName) parts.unshift(`"${relationName}"`);

      out += `  ${relField.padEnd(36)} ${refModel}${optional}  @relation(${parts.join(', ')})\n`;
    }

    // Back-relations (this model is referenced by other models).
    const usedBackFields = new Set(t.columns.map((c) => snakeToCamel(c.name)));
    for (const other of tables) {
      for (const c of other.columns) {
        if (!c.references || c.references.table !== t.name) continue;
        const grp = backRels.get(`${t.name}|${other.name}`) ?? [];
        const e = grp.find((g) => g.sourceCol === c.name);
        const relationName = e?.relationName;
        const ambiguous = !!relationName; // named -> always ambiguous from our viewpoint
        const base = (modelName(other.name)).charAt(0).toLowerCase() + modelName(other.name).slice(1);
        let backField = base + 's';
        if (ambiguous) backField = `${base}sAs${snakeToPascal(c.name).replace(/Id$/, '')}`;
        while (usedBackFields.has(backField)) backField = backField + '_';
        usedBackFields.add(backField);
        const relAttr = relationName ? `@relation("${relationName}")` : '';
        out += `  ${backField.padEnd(36)} ${modelName(other.name)}[]${relAttr ? ' ' + relAttr : ''}\n`;
      }
    }

    // Indexes
    for (const ix of t.indexes) {
      const cols = ix.cols.map(snakeToCamel);
      const attr = ix.unique
        ? `  @@unique([${cols.join(', ')}])`
        : `  @@index([${cols.join(', ')}])`;
      const note = ix.where ? `  /// partial: WHERE ${ix.where}` : '';
      out += `${attr}${note}\n`;
    }

    // Composite unique constraints
    for (const c of t.tableConstraints) {
      if (c.kind === 'unique') {
        const cols = c.cols.map(snakeToCamel);
        out += `  @@unique([${cols.join(', ')}])\n`;
      }
    }

    out += `  @@map("${t.name}")\n`;
    out += `}\n\n`;
  }

  return out;
}

const prisma = emitPrisma();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, prisma, 'utf8');

console.log(`✓ Emitted ${tables.length} models to ${OUT}`);
