import 'server-only';

import { prisma } from '@/src/lib/prisma';
import type { ContactOption, OrganizationOption, OfferingOption } from '@/src/lib/billing/billing-bootstrap';

const PICKER_LIMIT = 20;

export type WorkOrderBootstrap = {
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  offerings: ReadonlyArray<OfferingOption>;
};

export async function loadWorkOrderBootstrap(): Promise<WorkOrderBootstrap> {
  const [contacts, organizations, offerings] = await Promise.all([
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
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, relationshipType: true },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }],
      take: PICKER_LIMIT,
      select: { id: true, name: true, category: true, suggestedPrice: true },
    }),
  ]);

  return {
    contacts: contacts.map((contact) => ({
      id: contact.id,
      name: contact.name ?? contact.email ?? 'Contact',
      email: contact.email,
      organizationId: contact.organizationId,
      organizationName: contact.organization?.name ?? null,
    })),
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      relationshipType: org.relationshipType,
    })),
    offerings: offerings.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      suggestedPrice: service.suggestedPrice ? service.suggestedPrice.toString() : null,
    })),
  };
}
