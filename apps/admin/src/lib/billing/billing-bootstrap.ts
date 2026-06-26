/**
 * Server-side bootstrap loader for invoice and estimate create/edit pages.
 *
 * Returns the lightweight reference data the editor needs in its initial
 * render — number preview, recent contacts/organizations, popular products,
 * estimate templates — so the page can hydrate without immediately racing
 * the autocomplete endpoints.
 */
import 'server-only';

import { prisma } from '@/src/lib/prisma';
import { previewNextNumber, type NumberedKind } from '@/src/lib/accounting/numbering';
import { materialProductWhere } from '@/src/lib/billing/line-item-kinds';

const PICKER_LIMIT = 20;

export type BillingDocumentKind = 'invoice' | 'estimate';

export type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  organizationId: string | null;
  organizationName: string | null;
};

export type OrganizationOption = {
  id: string;
  name: string;
  relationshipType: string;
};

export type ProductOption = {
  id: string;
  name: string;
  unitPrice: string | null;
  category: string;
};

export type OfferingOption = {
  id: string;
  name: string;
  category: string;
  suggestedPrice: string | null;
};

export type EstimateTemplateOption = {
  id: string;
  name: string;
  description: string | null;
  introText: string | null;
  footerText: string | null;
  paymentTerms: string | null;
  accentColor: string;
  lineItems: ReadonlyArray<{
    kind?: string;
    description?: string | null;
    quantity?: number | string | null;
    unitPrice?: number | string | null;
  }>;
};

export type BillingCreateBootstrap = {
  kind: BillingDocumentKind;
  nextNumber: string;
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
  offerings: ReadonlyArray<OfferingOption>;
  estimateTemplates: ReadonlyArray<EstimateTemplateOption>;
};

function numberedKind(kind: BillingDocumentKind): NumberedKind {
  return kind === 'invoice' ? 'invoice' : 'estimate';
}

export async function loadBillingCreateBootstrap({
  kind,
}: {
  kind: BillingDocumentKind;
}): Promise<BillingCreateBootstrap> {
  const [nextNumber, contacts, organizations, products, materials, services, estimateTemplates] =
    await Promise.all([
    previewNextNumber(numberedKind(kind)),
    prisma.contact.findMany({
      where: { status: 'active' },
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: {
        id: true,
        name: true,
        email: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.organization.findMany({
      where: { status: 'active' },
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, relationshipType: true },
    }),
    prisma.product.findMany({
      where: { isForSale: true },
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, unitPrice: true, category: true },
    }),
    prisma.product.findMany({
      where: materialProductWhere(),
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, unitPrice: true, category: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, suggestedPrice: true, category: true },
    }),
    kind === 'estimate'
      ? prisma.estimateTemplate.findMany({
          where: { isActive: true },
          orderBy: [{ name: 'asc' }],
          take: PICKER_LIMIT,
          select: {
            id: true,
            name: true,
            description: true,
            introText: true,
            footerText: true,
            paymentTerms: true,
            accentColor: true,
            lineItems: true,
          },
        })
      : Promise.resolve([] as Array<never>),
  ]);

  return {
    kind,
    nextNumber,
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name: contact.name ?? '(Unnamed contact)',
      email: contact.email,
      organizationId: contact.organizationId,
      organizationName: contact.organization?.name ?? null,
    })),
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      relationshipType: org.relationshipType,
    })),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: product.unitPrice ? product.unitPrice.toString() : null,
      category: product.category,
    })),
    materials: materials.map((product) => ({
      id: product.id,
      name: product.name,
      unitPrice: product.unitPrice ? product.unitPrice.toString() : null,
      category: product.category,
    })),
    offerings: services.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      suggestedPrice: service.suggestedPrice ? service.suggestedPrice.toString() : null,
    })),
    estimateTemplates: estimateTemplates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      introText: template.introText,
      footerText: template.footerText,
      paymentTerms: template.paymentTerms,
      accentColor: template.accentColor,
      lineItems: parseTemplateLineItems(template.lineItems),
    })),
  };
}

function parseTemplateLineItems(value: unknown): EstimateTemplateOption['lineItems'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as Record<string, unknown>;
    return [
      {
        kind: typeof candidate.kind === 'string' ? candidate.kind : 'custom',
        description:
          typeof candidate.description === 'string' ? candidate.description : null,
        quantity:
          typeof candidate.quantity === 'number' || typeof candidate.quantity === 'string'
            ? candidate.quantity
            : null,
        unitPrice:
          typeof candidate.unitPrice === 'number' || typeof candidate.unitPrice === 'string'
            ? candidate.unitPrice
            : typeof candidate.unit_price === 'number' || typeof candidate.unit_price === 'string'
              ? candidate.unit_price
              : null,
      },
    ];
  });
}
