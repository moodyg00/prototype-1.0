import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { getAppBaseUrl } from '@/src/lib/integrations/system-settings';
import { sendEmail } from '@/src/lib/email/provider';
import { prisma } from '@/src/lib/prisma';
import {
  renderBookingPageEmailHtml,
  renderBookingPageEmailText,
} from '@/src/lib/scheduling/booking-page';
import { proposeSlotsForBookingLink } from '@/src/lib/scheduling/slots-server';
import type { CollectField } from '@/src/lib/validation/scheduling';

type RouteParams = { params: Promise<{ id: string }> };

const emailSchema = z.object({
  to: z.string().trim().email('A valid recipient email is required.'),
});

/**
 * "Email the page" — the email body is the rendered booking page HTML (same
 * content as `/book/[token]`), not just a hyperlink. A CTA button links to the
 * live page where the customer can actually submit.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const { to } = emailSchema.parse(body);

    const link = await prisma.bookingLink.findUnique({
      where: { id },
      select: {
        name: true,
        publicToken: true,
        linkKind: true,
        isActive: true,
        serviceId: true,
        durationMinutes: true,
        channel: true,
        fieldsToCollect: true,
        proposedSlots: true,
        expiresAt: true,
        service: { select: { name: true } },
        contact: { select: { name: true } },
      },
    });

    if (!link || !link.isActive) return jsonError(404, 'Booking link not found.');

    const origin = await getAppBaseUrl(new URL(request.url).origin);
    const publicUrl = `${origin}/book/${link.publicToken}`;

    const proposedSlots = await proposeSlotsForBookingLink({
      serviceId: link.serviceId,
      durationMinutes: link.durationMinutes,
      proposedSlots: link.proposedSlots,
    });

    const pageData = {
      name: link.name,
      linkKind: link.linkKind as 'standard' | 'personalized' | 'confirmation',
      serviceName: link.service?.name ?? null,
      contactName: link.contact?.name ?? null,
      durationMinutes: link.durationMinutes,
      channel: link.channel,
      fieldsToCollect: (link.fieldsToCollect ?? []) as unknown as CollectField[],
      proposedSlots,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    };

    const result = await sendEmail({
      to,
      subject: link.name,
      html: renderBookingPageEmailHtml(pageData, publicUrl),
      text: renderBookingPageEmailText(pageData, publicUrl),
    });

    return NextResponse.json({
      ok: true,
      detail: result.detail,
      delivered: result.delivered,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
