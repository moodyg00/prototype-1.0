/**
 * Money / decimal helpers for accounting.
 *
 * - All arithmetic uses Prisma's bundled Decimal (decimal.js compatible) to
 *   avoid the precision pitfalls of native JS floats.
 * - Inputs accept Decimal, number, or string; outputs are Decimal.
 * - String formatters round to 2 decimal places only at the display boundary.
 */
// Import the browser-safe namespace so this helper can be used from both
// server and client components without dragging in the Node-only Prisma
// runtime (which uses `node:async_hooks`). `Prisma.Decimal` is the same
// decimal.js class in both entry points.
import { Prisma } from '@prototype/db/browser';

export const Decimal = Prisma.Decimal;
export type Decimal = InstanceType<typeof Prisma.Decimal>;

export type DecimalInput = Decimal | number | string | null | undefined;

const ZERO = new Prisma.Decimal(0);

export function toDecimal(value: DecimalInput): Decimal {
  if (value === null || value === undefined) return ZERO;
  if (value instanceof Prisma.Decimal) return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ZERO;
    return new Prisma.Decimal(value);
  }
  const trimmed = String(value).trim();
  if (trimmed.length === 0) return ZERO;
  try {
    return new Prisma.Decimal(trimmed);
  } catch {
    return ZERO;
  }
}

export function add(a: DecimalInput, b: DecimalInput): Decimal {
  return toDecimal(a).add(toDecimal(b));
}

export function sub(a: DecimalInput, b: DecimalInput): Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

export function sum(values: ReadonlyArray<DecimalInput>): Decimal {
  return values.reduce<Decimal>((acc, value) => acc.add(toDecimal(value)), ZERO);
}

export function isZero(value: DecimalInput): boolean {
  return toDecimal(value).isZero();
}

export function eq(a: DecimalInput, b: DecimalInput): boolean {
  return toDecimal(a).eq(toDecimal(b));
}

export function gt(a: DecimalInput, b: DecimalInput): boolean {
  return toDecimal(a).gt(toDecimal(b));
}

export function lt(a: DecimalInput, b: DecimalInput): boolean {
  return toDecimal(a).lt(toDecimal(b));
}

export function negate(value: DecimalInput): Decimal {
  return toDecimal(value).neg();
}

/**
 * Round to 2 decimal places half-up. We only round at display/storage edges so
 * any intermediate math keeps the full precision of decimal.js.
 */
export function round2(value: DecimalInput): Decimal {
  return toDecimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/** Two-decimal string representation, e.g. "1234.50". Suitable for `@db.Decimal(12, 2)`. */
export function toAmountString(value: DecimalInput): string {
  return round2(value).toFixed(2);
}

/** Plain number for UI sums; do NOT use for storage or further math. */
export function toNumber(value: DecimalInput): number {
  return round2(value).toNumber();
}

/**
 * Human currency display string, e.g. "$1,234.50" or "-$1,234.50".
 * Uses Intl with USD by default; the consumer can pass a different currency.
 */
export function formatCurrency(value: DecimalInput, currency = 'USD'): string {
  const numeric = toNumber(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/** Same as `formatCurrency` but without the leading currency symbol. */
export function formatAmount(value: DecimalInput): string {
  const numeric = toNumber(value);
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** True when total debits equal total credits. */
export function isBalanced(totalDebits: DecimalInput, totalCredits: DecimalInput): boolean {
  return round2(totalDebits).eq(round2(totalCredits));
}

/** Signed difference debits - credits, rounded to 2dp. Positive → debits over. */
export function balanceDifference(totalDebits: DecimalInput, totalCredits: DecimalInput): Decimal {
  return round2(toDecimal(totalDebits).sub(toDecimal(totalCredits)));
}
