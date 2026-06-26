import { NextResponse } from 'next/server';

import { Prisma } from '@prototype/db';
import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { sendEmail } from '@/src/lib/email/provider';
import { createWorkOrderFromLatestEstimate, applyConfirmedBookingToWorkOrder } from '@/src/lib/scheduling/work-order';
import {
  publicBookingSubmitSchema,
  validateCollectedData,
  type CollectField,
  type ProposedSlot,
} from '@/src/lib/validation/scheduling';

type RouteParams = { params: Promise<{ token: string }> };

const TENTATIVE = ['draft', 'pending_customer', 'unconfirmed'];

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = publicBookingSubmitSchema.parse(body);

    const link = await prisma.bookingLink.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        isActive: true,
        expiresAt: true,
        linkKind: true,
        contactId: true,
        serviceId: true,
        workOrderId: true,
        durationMinutes: true,
        fieldsToCollect: true,
        proposedSlots: true,
      },
    });

    if (!link || !link.isActive) return jsonError(404, 'This booking link is not available.');
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
      return jsonError(410, 'This booking link has expired.');
    }

    const fields = (link.fieldsToCollect ?? []) as unknown as CollectField[];
    const fieldErrors = validateCollectedData(fields, parsed.collectedData);
    if (fieldErrors.length > 0) {
      return jsonError(422, 'Please complete the required fields.', { fields: fieldErrors });
    }

    const startsAt = new Date(parsed.startsAt);
    const endsAt = new Date(parsed.endsAt);

    // Confirmation links must resolve to one of the proposed slots.
    if (link.linkKind === 'confirmation') {
      const slots = (link.proposedSlots ?? []) as unknown as ProposedSlot[];
      const matches = slots.some(
        (s) => new Date(s.startsAt).getTime() === startsAt.getTime(),
      );
      if (slots.length > 0 && !matches) {
        return jsonError(422, 'Please choose one of the proposed times.');
      }
    }

    const durationMinutes =
      link.durationMinutes ?? Math.round((endsAt.getTime() - startsAt.getTime()) / 60000);
    const bookingDate = new Date(
      Date.UTC(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()),
    );
    const contactId = link.contactId ?? null;

    const result = await prisma.$transaction(async (tx) => {
      // Reuse an existing tentative booking on this link (e.g. an admin-created
      // pending hold) instead of creating a duplicate.
      const existing = await tx.booking.findFirst({
        where: { bookingLinkId: link.id, status: { in: TENTATIVE } },
        orderBy: [{ createdAt: 'desc' }],
        select: { id: true },
      });

      const data = {
        contactId,
        serviceId: link.serviceId ?? null,
        bookingLinkId: link.id,
        status: 'confirmed',
        source: 'booking_link',
        bookingDate,
        startsAt,
        endsAt,
        durationMinutes,
        collectedData: parsed.collectedData as unknown as Prisma.InputJsonValue,
      };

      const booking = existing
        ? await tx.booking.update({ where: { id: existing.id }, data, select: { id: true } })
        : await tx.booking.create({ data, select: { id: true } });

      const wo = link.workOrderId
        ? { workOrderId: link.workOrderId, reason: 'from_link' as const }
        : await createWorkOrderFromLatestEstimate(tx, {
            contactId,
            serviceId: link.serviceId ?? null,
          });

      if (wo.workOrderId) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { workOrderId: wo.workOrderId },
        });
        await applyConfirmedBookingToWorkOrder(tx, {
          workOrderId: wo.workOrderId,
          bookingDate,
        });
      }

      return { bookingId: booking.id, workOrder: wo };
    });

    // Best-effort staff notification (no-op if email isn't configured).
    void sendEmail({
      to: 'staff@proto2.app',
      subject: 'New booking confirmed',
      text: `A booking was confirmed for ${startsAt.toISOString()}.`,
    }).catch(() => undefined);

    return NextResponse.json({
      ok: true,
      bookingId: result.bookingId,
      workOrderId: result.workOrder.workOrderId,
      workOrderNote:
        result.workOrder.reason === 'from_link'
          ? 'Booking attached to the linked work order.'
          : result.workOrder.reason === 'from_estimate'
            ? 'Work order created from the latest estimate.'
            : result.workOrder.reason === 'no_estimate_fallback'
              ? 'Work order created without an estimate (none found for this contact).'
              : 'No work order created (no contact on this link).',
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
