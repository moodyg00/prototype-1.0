import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import {
  ManualSendError,
  manualSendErrorStatus,
  performManualSend,
  resolveRecipients,
} from '@/src/lib/email/manual-send';
import { manualSendSchema } from '@/src/lib/validation/email';

/**
 * Manual one-off "Send" override for a single EmailTemplate. This is NOT a
 * campaign: it resolves the chosen audience to recipients and performs the
 * override send via `sendEmail` (settings → email/provider). SMTP delivers when
 * configured; otherwise the provider helper logs a no-op and reports counts.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = manualSendSchema.parse(body);

    const template = await prisma.emailTemplate.findUnique({
      where: { id: parsed.templateId },
      select: { id: true, name: true, subject: true },
    });
    if (!template) {
      throw new ManualSendError('TEMPLATE_NOT_FOUND', 'Template not found.');
    }

    const resolved = await resolveRecipients(parsed.selection);

    // Perform the send first. This validates there is at least one recipient
    // (throws NO_RECIPIENTS otherwise) so we don't persist an empty audience as
    // a side effect of a failed send.
    const result = await performManualSend(template, resolved.recipients);

    // Optionally persist the manual selection as a reusable EmailAudience.
    let savedAudienceId: string | null = null;
    if (parsed.saveAsAudience) {
      const audience = await prisma.emailAudience.create({
        data: {
          name: parsed.saveAsAudience.name,
          status: 'active',
          filterRules: resolved.filterRules,
          estimatedRecipientCount: resolved.recipients.length,
        },
        select: { id: true },
      });
      savedAudienceId = audience.id;
    }

    return NextResponse.json({
      ok: true,
      template: { id: template.id, name: template.name },
      provider: result.provider,
      delivered: result.delivered,
      recipientCount: resolved.recipients.length,
      skippedNoEmail: resolved.skippedNoEmail,
      savedAudienceId,
    });
  } catch (error) {
    if (error instanceof ManualSendError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: manualSendErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}
