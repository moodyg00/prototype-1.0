import { notFound } from 'next/navigation';

import { PublicBookingForm } from '@/src/components/scheduling/PublicBookingForm';
import { prisma } from '@/src/lib/prisma';
import { renderBookingContentHtml } from '@/src/lib/scheduling/booking-page';
import type { CollectField, ProposedSlot } from '@/src/lib/validation/scheduling';

type PageProps = { params: Promise<{ token: string }> };

export default async function PublicBookingPage({ params }: PageProps) {
  const { token } = await params;

  const link = await prisma.bookingLink.findUnique({
    where: { publicToken: token },
    select: {
      name: true,
      linkKind: true,
      isActive: true,
      durationMinutes: true,
      channel: true,
      knownData: true,
      fieldsToCollect: true,
      proposedSlots: true,
      expiresAt: true,
      service: { select: { name: true } },
      contact: { select: { name: true } },
    },
  });

  if (!link || !link.isActive) notFound();
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h1 className="text-lg font-semibold">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">This booking link is no longer accepting responses.</p>
      </div>
    );
  }

  const pageData = {
    name: link.name,
    linkKind: link.linkKind as 'standard' | 'personalized' | 'confirmation',
    serviceName: link.service?.name ?? null,
    contactName: link.contact?.name ?? null,
    durationMinutes: link.durationMinutes,
    channel: link.channel,
    fieldsToCollect: (link.fieldsToCollect ?? []) as unknown as CollectField[],
    proposedSlots: (link.proposedSlots ?? []) as unknown as ProposedSlot[],
    expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
  };

  const contentHtml = renderBookingContentHtml(pageData);

  return (
    <article>
      {/* Same HTML the email body uses (minus the outer email wrapper). */}
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <PublicBookingForm
        token={token}
        meta={{
          name: pageData.name,
          linkKind: pageData.linkKind,
          serviceName: pageData.serviceName,
          knownData: (link.knownData ?? {}) as Record<string, unknown>,
          fieldsToCollect: pageData.fieldsToCollect,
          proposedSlots: pageData.proposedSlots,
        }}
      />
    </article>
  );
}
