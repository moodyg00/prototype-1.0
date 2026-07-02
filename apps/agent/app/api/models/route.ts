import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export type ModelCatalogRow = {
  id: string;
  catalogId: string;
  provider: string;
  apiModelId: string | null;
  label: string;
  description: string | null;
  category: string;
  specializations: string[];
  capabilities: string[];
  contextWindowTokens: number | null;
  pricePerMInputTokens: number | null;
  pricePerMOutputTokens: number | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  lastUpdatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function serializeDecimal(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  // Prisma Decimal objects expose toNumber via valueOf or toNumber
  const asAny = value as { toNumber?: () => number; valueOf?: () => number };
  if (typeof asAny.toNumber === 'function') return asAny.toNumber();
  const viaValue = typeof asAny.valueOf === 'function' ? asAny.valueOf() : null;
  if (typeof viaValue === 'number') return viaValue;
  return null;
}

function toRow(model: {
  id: string;
  catalogId: string;
  provider: string;
  apiModelId: string | null;
  label: string;
  description: string | null;
  category: string;
  specializations: unknown;
  capabilities: unknown;
  contextWindowTokens: number | null;
  pricePerMInputTokens: unknown;
  pricePerMOutputTokens: unknown;
  isActive: boolean;
  metadata: unknown;
  lastUpdatedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): ModelCatalogRow {
  return {
    id: model.id,
    catalogId: model.catalogId,
    provider: model.provider,
    apiModelId: model.apiModelId,
    label: model.label,
    description: model.description,
    category: model.category,
    specializations: Array.isArray(model.specializations) ? (model.specializations as string[]) : [],
    capabilities: Array.isArray(model.capabilities) ? (model.capabilities as string[]) : [],
    contextWindowTokens: model.contextWindowTokens,
    pricePerMInputTokens: serializeDecimal(model.pricePerMInputTokens),
    pricePerMOutputTokens: serializeDecimal(model.pricePerMOutputTokens),
    isActive: model.isActive,
    metadata: (model.metadata as Record<string, unknown> | null) ?? null,
    lastUpdatedAt: model.lastUpdatedAt?.toISOString() ?? null,
    createdAt: model.createdAt?.toISOString() ?? null,
    updatedAt: model.updatedAt?.toISOString() ?? null,
  };
}

/** List the full AI model catalog (text, image, video). */
export async function GET() {
  try {
    const models = await prisma.aiModel.findMany({
      orderBy: [{ category: 'asc' }, { provider: 'asc' }, { label: 'asc' }],
    });
    return NextResponse.json({ models: models.map(toRow) });
  } catch (err) {
    console.error('[api/models] failed to load model catalog:', (err as Error).message);
    return NextResponse.json(
      { error: 'Failed to load model catalog', models: [] },
      { status: 500 },
    );
  }
}
