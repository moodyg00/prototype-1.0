import { NextResponse } from 'next/server';

import { processMercuryWebhookEvent } from '@/src/lib/banking/process-mercury-webhook';
import { getActiveApiIntegration } from '@/src/lib/integrations/load-integration';
import type { MercuryWebhookEvent } from '@/src/lib/mercury/types';
import { verifyMercuryWebhookSignature } from '@/src/lib/mercury/webhook';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('Mercury-Signature');
  const integration = await getActiveApiIntegration('mercury');
  const secret = integration?.webhookSecret?.trim() ?? null;

  if (!secret) {
    return NextResponse.json(
      { error: 'Mercury webhook secret is not configured. Set it under Admin → API integrations.' },
      { status: 503 },
    );
  }

  if (!verifyMercuryWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  let event: MercuryWebhookEvent;
  try {
    event = JSON.parse(rawBody) as MercuryWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!event?.id || !event.resourceType || !event.resourceId) {
    return NextResponse.json({ error: 'Malformed webhook event.' }, { status: 400 });
  }

  // Respond immediately; Mercury retries if this takes longer than ~5 seconds.
  void processMercuryWebhookEvent(event).catch((error) => {
    console.error('[mercury-webhook] Failed to process event:', event.id, error);
  });

  return NextResponse.json({ ok: true, received: event.id });
}
