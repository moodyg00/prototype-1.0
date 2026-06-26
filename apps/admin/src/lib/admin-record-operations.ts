import { prisma } from '@/src/lib/prisma';

import { isAdminDbSection, type AdminCreateSection, type AdminDbSection } from '@/src/lib/admin-record-form-config';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'error' | 'destructive';

type AdminListItem = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  metric?: string;
  badge?: {
    label: string;
    variant?: BadgeVariant;
  };
  meta: Array<{ label: string; value: string }>;
};

type RecordResult = {
  title: string;
  record: Record<string, unknown>;
};

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value: unknown) {
  const nextValue = trimString(value);
  return nextValue.length > 0 ? nextValue : undefined;
}

function optionalBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true' || value === 'on' || value === '1') return true;
    if (value === 'false' || value === 'off' || value === '0') return false;
  }
  return fallback;
}

function optionalNumber(value: unknown) {
  const nextValue = typeof value === 'string' && value.trim().length === 0 ? undefined : value;
  if (nextValue === undefined || nextValue === null) return undefined;
  const numericValue = typeof nextValue === 'number' ? nextValue : Number(nextValue);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function decimalValue(value: unknown, fallback = '0.00') {
  const nextValue = optionalNumber(value);
  return typeof nextValue === 'number' ? nextValue.toFixed(2) : fallback;
}

function optionalDecimalValue(value: unknown) {
  const nextValue = optionalNumber(value);
  return typeof nextValue === 'number' ? nextValue.toFixed(2) : undefined;
}

function parseDateInput(value: unknown) {
  const nextValue = optionalString(value);
  if (!nextValue) return undefined;
  const parsed = new Date(`${nextValue}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function createAutoNumber(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => serializeValue(entry));
  }

  if (value && typeof value === 'object') {
    const constructorName = (value as { constructor?: { name?: string } }).constructor?.name?.toLowerCase();
    if (constructorName?.includes('decimal')) {
      return (value as { toString: () => string }).toString();
    }

    if (typeof (value as { toJSON?: () => unknown }).toJSON === 'function' && constructorName) {
      // Guard against other Prisma runtime wrappers that should be plain JSON in Client Components.
      const jsonValue = (value as { toJSON: () => unknown }).toJSON();
      if (jsonValue !== value) {
        return serializeValue(jsonValue);
      }
    }

    if (typeof (value as { toString?: () => string }).toString === 'function' && Array.isArray((value as { d?: unknown }).d)) {
      // Decimal.js-like fallback shape (s/e/d internals) used by some Prisma runtime builds.
      return value.toString();
    }

    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, serializeValue(entry)]));
  }

  return value;
}

function serializeRecord(record: Record<string, unknown>) {
  return serializeValue(record) as Record<string, unknown>;
}

async function ensureOrganization(name: string) {
  return prisma.organization.create({
    data: {
      name,
      status: 'active',
    },
  });
}

async function ensureContact(args: { name: string; organizationId?: string; email?: string; phone?: string }) {
  return prisma.contact.create({
    data: {
      name: args.name,
      organizationId: args.organizationId,
      email: args.email,
      phone: args.phone,
      status: 'active',
    },
  });
}

function fieldValue(values: Record<string, unknown>, key: string) {
  return values[key];
}

function toCurrencyMetric(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return `$${numeric.toLocaleString()}`;
}

function toListMeta(entries: Array<{ label: string; value: string | undefined }>) {
  return entries
    .filter((entry) => entry.value && entry.value.trim().length > 0)
    .map((entry) => ({ label: entry.label, value: entry.value as string }));
}

export async function listAdminRecords(section: AdminDbSection): Promise<AdminListItem[]> {
  switch (section) {
    case 'work-orders': {
      const records = await prisma.workOrder.findMany({
        take: 200,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          workOrderNumber: true,
          customerName: true,
          serviceName: true,
          status: true,
          workOrderItems: {
            orderBy: [{ sortOrder: 'asc' }],
            take: 3,
            select: { description: true, service: { select: { name: true } } },
          },
          _count: { select: { workOrderItems: true } },
        },
      });
      return records.map((record) => {
        const lineSummary =
          record._count.workOrderItems > 0
            ? record.workOrderItems
                .map((item) => item.service?.name ?? item.description)
                .filter(Boolean)
                .join(', ')
            : (record.serviceName ?? 'No services');
        const extra =
          record._count.workOrderItems > record.workOrderItems.length
            ? ` +${record._count.workOrderItems - record.workOrderItems.length} more`
            : '';
        return {
          id: record.id,
          name: record.workOrderNumber,
          subtitle: record.customerName ?? 'No customer name',
          category: record.status,
          badge: { label: record.status, variant: 'outline' },
          meta: toListMeta([
            { label: 'Customer', value: record.customerName ?? undefined },
            { label: 'Services', value: `${lineSummary}${extra}` },
          ]),
        };
      });
    }
    case 'invoices': {
      const records = await prisma.invoice.findMany({ take: 200, select: { id: true, invoiceNumber: true, organizationName: true, status: true, totalAmount: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.invoiceNumber,
        subtitle: record.organizationName ?? 'No organization',
        category: record.status,
        metric: toCurrencyMetric(record.totalAmount),
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([{ label: 'Organization', value: record.organizationName ?? undefined }]),
      }));
    }
    case 'estimates': {
      const records = await prisma.estimate.findMany({ take: 200, select: { id: true, estimateNumber: true, title: true, status: true, totalAmount: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.estimateNumber,
        subtitle: record.title,
        category: record.status,
        metric: toCurrencyMetric(record.totalAmount),
        badge: { label: record.status, variant: 'outline' },
        meta: [],
      }));
    }
    case 'contacts': {
      const records = await prisma.contact.findMany({ take: 200, select: { id: true, name: true, email: true, status: true, type: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name ?? record.email ?? record.id,
        subtitle: record.email ?? 'No email',
        category: record.type,
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([
          { label: 'Type', value: record.type },
          { label: 'Status', value: record.status },
        ]),
      }));
    }
    case 'leads': {
      const records = await prisma.lead.findMany({ take: 200, select: { id: true, name: true, source: true, status: true, expectedValue: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.source ?? 'No source',
        category: record.status,
        metric: toCurrencyMetric(record.expectedValue),
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([{ label: 'Source', value: record.source ?? undefined }]),
      }));
    }
    case 'organizations': {
      const records = await prisma.organization.findMany({ take: 200, select: { id: true, name: true, relationshipType: true, status: true, industry: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.industry ?? 'No industry',
        category: record.relationshipType,
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([{ label: 'Relationship', value: record.relationshipType }]),
      }));
    }
    case 'bank-accounts': {
      const records = await prisma.bankAccount.findMany({
        take: 200,
        orderBy: [{ accountType: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          accountType: true,
          status: true,
          currentBalance: true,
          bankName: true,
          provider: true,
          lastSyncedAt: true,
        },
      });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.bankName ?? 'No bank name',
        category: record.accountType,
        metric: toCurrencyMetric(record.currentBalance),
        badge: { label: record.status ?? 'unknown', variant: 'outline' },
        meta: toListMeta([
          { label: 'Type', value: record.accountType },
          { label: 'Provider', value: record.provider ?? undefined },
          {
            label: 'Last sync',
            value: record.lastSyncedAt ? record.lastSyncedAt.toLocaleString() : 'Never',
          },
        ]),
      }));
    }
    case 'bank-cards': {
      const records = await prisma.bankCard.findMany({
        take: 200,
        orderBy: [{ status: 'asc' }, { cardName: 'asc' }],
        select: {
          id: true,
          cardName: true,
          status: true,
          cardType: true,
          last4: true,
          network: true,
          spendLimitInterval: true,
          lastSyncedAt: true,
          bankAccount: { select: { name: true } },
        },
      });
      return records.map((record) => ({
        id: record.id,
        name: record.cardName,
        subtitle: record.bankAccount?.name ?? (record.last4 ? `•••• ${record.last4}` : 'No account'),
        category: record.cardType ?? 'other',
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([
          { label: 'Network', value: record.network ?? undefined },
          { label: 'Limit', value: record.spendLimitInterval ?? undefined },
          {
            label: 'Last sync',
            value: record.lastSyncedAt ? record.lastSyncedAt.toLocaleString() : 'Never',
          },
        ]),
      }));
    }
    case 'catalog': {
      const records = await prisma.product.findMany({ take: 200, select: { id: true, name: true, category: true, unitPrice: true, sku: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.sku ?? 'No SKU',
        category: record.category,
        metric: toCurrencyMetric(record.unitPrice),
        meta: toListMeta([{ label: 'SKU', value: record.sku ?? undefined }]),
      }));
    }
    case 'offerings': {
      const records = await prisma.service.findMany({ take: 200, select: { id: true, name: true, category: true, suggestedPrice: true, description: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.description ?? 'No description',
        category: record.category,
        metric: toCurrencyMetric(record.suggestedPrice),
        meta: [],
      }));
    }
    case 'bills': {
      const records = await prisma.bill.findMany({ take: 200, select: { id: true, billNumber: true, vendorName: true, status: true, totalAmount: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.billNumber,
        subtitle: record.vendorName ?? 'No vendor',
        category: record.status,
        metric: toCurrencyMetric(record.totalAmount),
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([{ label: 'Vendor', value: record.vendorName ?? undefined }]),
      }));
    }
    case 'ads': {
      const records = await prisma.ad.findMany({ take: 200, select: { id: true, name: true, platform: true, status: true, budget: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.platform,
        category: record.status,
        metric: toCurrencyMetric(record.budget),
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([
          { label: 'Platform', value: record.platform ?? undefined },
          { label: 'Status', value: record.status },
        ]),
      }));
    }
    case 'campaigns': {
      const records = await prisma.adCampaign.findMany({ take: 200, select: { id: true, name: true, platform: true, status: true, totalBudget: true } });
      return records.map((record) => ({
        id: record.id,
        name: record.name,
        subtitle: record.platform ?? 'No platform',
        category: record.status,
        metric: toCurrencyMetric(record.totalBudget),
        badge: { label: record.status, variant: 'outline' },
        meta: toListMeta([{ label: 'Status', value: record.status }]),
      }));
    }
    case 'chart-of-accounts': {
      const records = await prisma.chartOfAccount.findMany({ take: 200, select: { id: true, code: true, name: true, type: true, subType: true, isActive: true } });
      return records.map((record) => ({
        id: record.id,
        name: `${record.code} • ${record.name}`,
        subtitle: record.name,
        category: record.type,
        badge: { label: record.isActive ? 'active' : 'inactive', variant: 'outline' },
        meta: toListMeta([
          { label: 'Type', value: record.type },
          ...(record.subType ? [{ label: 'Sub-type', value: record.subType.replace(/_/g, ' ') }] : []),
        ]),
      }));
    }
    default:
      return [];
  }
}

export async function getAdminRecordDetail(section: string, id: string): Promise<RecordResult | null> {
  if (!isAdminDbSection(section)) {
    return null;
  }

  switch (section) {
    case 'work-orders': {
      const record = await prisma.workOrder.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.workOrderNumber, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'invoices': {
      const record = await prisma.invoice.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.invoiceNumber, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'estimates': {
      const record = await prisma.estimate.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.estimateNumber, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'contacts': {
      const record = await prisma.contact.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name ?? record.email ?? record.id, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'leads': {
      const record = await prisma.lead.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'organizations': {
      const record = await prisma.organization.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'bank-accounts': {
      const record = await prisma.bankAccount.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'bank-cards': {
      const record = await prisma.bankCard.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.cardName, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'catalog': {
      const record = await prisma.product.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'offerings': {
      const record = await prisma.service.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'bills': {
      const record = await prisma.bill.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.billNumber, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'ads': {
      const record = await prisma.ad.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'campaigns': {
      const record = await prisma.adCampaign.findUnique({ where: { id } });
      if (!record) return null;
      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'chart-of-accounts': {
      const record = await prisma.chartOfAccount.findUnique({ where: { id } });
      if (!record) return null;
      return { title: `${record.code} • ${record.name}`, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    default:
      return null;
  }
}

export async function createAdminRecord(section: AdminCreateSection, values: Record<string, unknown>): Promise<RecordResult> {
  return createAdminRecordInternal(section, values);
}

async function createAdminRecordInternal(section: AdminCreateSection, values: Record<string, unknown>): Promise<RecordResult> {
  switch (section) {
    case 'contacts': {
      let organizationId: string | undefined;
      const organizationName = optionalString(fieldValue(values, 'organizationName'));
      if (organizationName) {
        const organization = await ensureOrganization(organizationName);
        organizationId = organization.id;
      }

      const record = await prisma.contact.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Contact',
          organizationId,
          title: optionalString(fieldValue(values, 'title')),
          type: optionalString(fieldValue(values, 'type')) ?? 'other',
          phone: optionalString(fieldValue(values, 'phone')),
          email: optionalString(fieldValue(values, 'email')),
          source: optionalString(fieldValue(values, 'source')),
          status: optionalString(fieldValue(values, 'status')) ?? 'active',
          notes: optionalString(fieldValue(values, 'notes')) ? { summary: optionalString(fieldValue(values, 'notes')) } : undefined,
        },
      });

      return { title: record.name ?? record.email ?? record.id, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'leads': {
      let organizationId: string | undefined;
      let contactId: string | undefined;
      const organizationName = optionalString(fieldValue(values, 'organizationName'));
      const selectedContactId = optionalString(fieldValue(values, 'contactId'));

      if (organizationName) {
        const organization = await ensureOrganization(organizationName);
        organizationId = organization.id;
      }

      if (selectedContactId) {
        const contact = await prisma.contact.findUnique({
          where: { id: selectedContactId },
          select: { id: true, organizationId: true },
        });
        if (!contact) {
          throw new Error('Selected contact was not found.');
        }
        contactId = contact.id;
        if (!organizationId && contact.organizationId) {
          organizationId = contact.organizationId;
        }
      }

      const record = await prisma.lead.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Lead',
          organizationId,
          contactId,
          source: optionalString(fieldValue(values, 'source')),
          status: optionalString(fieldValue(values, 'status')) ?? 'new',
          expectedValue: optionalDecimalValue(fieldValue(values, 'expectedValue')),
          nextFollowUp: parseDateInput(fieldValue(values, 'nextFollowUp')),
          notes: optionalString(fieldValue(values, 'notes')) ? { summary: optionalString(fieldValue(values, 'notes')) } : undefined,
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'organizations': {
      const record = await prisma.organization.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Organization',
          relationshipType: optionalString(fieldValue(values, 'relationshipType')) ?? 'other',
          organizationType: optionalString(fieldValue(values, 'organizationType')) ?? 'company',
          industry: optionalString(fieldValue(values, 'industry')),
          phone: optionalString(fieldValue(values, 'phone')),
          website: optionalString(fieldValue(values, 'website')),
          source: optionalString(fieldValue(values, 'source')),
          status: optionalString(fieldValue(values, 'status')) ?? 'active',
          notes: optionalString(fieldValue(values, 'notes')) ? { summary: optionalString(fieldValue(values, 'notes')) } : undefined,
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'organizations': {
      const record = await prisma.product.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Catalog Item',
          description: optionalString(fieldValue(values, 'description')),
          category: optionalString(fieldValue(values, 'category')) ?? 'other',
          unitPrice: optionalDecimalValue(fieldValue(values, 'unitPrice')),
          unitOfMeasure: optionalString(fieldValue(values, 'unitOfMeasure')),
          sku: optionalString(fieldValue(values, 'sku')),
          purchaseUrl: optionalString(fieldValue(values, 'purchaseUrl')),
          isForSale: optionalBoolean(fieldValue(values, 'isForSale')),
          isInternalUse: optionalBoolean(fieldValue(values, 'isInternalUse'), true),
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'offerings': {
      const record = await prisma.service.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Offering',
          description: optionalString(fieldValue(values, 'description')),
          quotePrompt: optionalString(fieldValue(values, 'quotePrompt')),
          category: optionalString(fieldValue(values, 'category')) ?? 'general',
          estimatedDurationMinutes: optionalNumber(fieldValue(values, 'estimatedDurationMinutes')),
          suggestedPrice: optionalDecimalValue(fieldValue(values, 'suggestedPrice')),
          isActive: optionalBoolean(fieldValue(values, 'isActive'), true),
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'bills': {
      const vendorName = optionalString(fieldValue(values, 'vendorName')) ?? 'New Vendor';
      const vendor = await ensureOrganization(vendorName);
      const issueDate = parseDateInput(fieldValue(values, 'issueDate')) ?? new Date();
      const dueDate = parseDateInput(fieldValue(values, 'dueDate')) ?? addDays(issueDate, 30);
      const subtotal = decimalValue(fieldValue(values, 'subtotal'));
      const taxAmount = decimalValue(fieldValue(values, 'taxAmount'));
      const totalAmount = optionalDecimalValue(fieldValue(values, 'totalAmount')) ?? decimalValue(Number(subtotal) + Number(taxAmount));
      const amountPaid = decimalValue(fieldValue(values, 'amountPaid'));

      const record = await prisma.bill.create({
        data: {
          billNumber: createAutoNumber('BILL'),
          vendorId: vendor.id,
          vendorName: vendor.name,
          issueDate,
          dueDate,
          status: optionalString(fieldValue(values, 'status')) ?? 'draft',
          subtotal,
          taxAmount,
          totalAmount,
          amountPaid,
          notes: optionalString(fieldValue(values, 'notes')),
        },
      });

      return { title: record.billNumber, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'ads': {
      const campaignName = optionalString(fieldValue(values, 'campaignName'));
      const platform = optionalString(fieldValue(values, 'platform')) ?? 'meta';
      let campaignId: string | undefined;

      if (campaignName) {
        const campaign = await prisma.adCampaign.create({
          data: {
            name: campaignName,
            platform,
            status: 'active',
            totalBudget: optionalDecimalValue(fieldValue(values, 'budget')),
            description: optionalString(fieldValue(values, 'description')),
          },
        });
        campaignId = campaign.id;
      }

      const record = await prisma.ad.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Ad',
          platform,
          campaignId,
          headline: optionalString(fieldValue(values, 'headline')),
          hook: optionalString(fieldValue(values, 'hook')),
          description: optionalString(fieldValue(values, 'description')),
          status: optionalString(fieldValue(values, 'status')) ?? 'draft',
          budget: optionalDecimalValue(fieldValue(values, 'budget')),
          startDate: parseDateInput(fieldValue(values, 'startDate')),
          endDate: parseDateInput(fieldValue(values, 'endDate')),
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    case 'campaigns': {
      const record = await prisma.adCampaign.create({
        data: {
          name: optionalString(fieldValue(values, 'name')) ?? 'New Campaign',
          platform: optionalString(fieldValue(values, 'platform')) ?? 'meta',
          status: optionalString(fieldValue(values, 'status')) ?? 'active',
          description: optionalString(fieldValue(values, 'description')),
          totalBudget: optionalDecimalValue(fieldValue(values, 'totalBudget')),
          startDate: parseDateInput(fieldValue(values, 'startDate')),
          endDate: parseDateInput(fieldValue(values, 'endDate')),
        },
      });

      return { title: record.name, record: serializeRecord(record as unknown as Record<string, unknown>) };
    }
    default:
      throw new Error(`Unsupported admin section: ${section}`);
  }
}
