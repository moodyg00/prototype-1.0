import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { sendEmail } from '@/src/lib/email/provider';

const testSchema = z.object({
  to: z.string().trim().email('A valid recipient email is required.'),
});

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const { to } = testSchema.parse(body);

    const result = await sendEmail({
      to,
      subject: 'Proto-2 test email',
      html: '<p>This is a test message from your Proto-2 outbound email settings.</p>',
      text: 'This is a test message from your Proto-2 outbound email settings.',
    });

    return NextResponse.json({
      ok: result.delivered,
      provider: result.provider,
      delivered: result.delivered,
      detail: result.detail,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
