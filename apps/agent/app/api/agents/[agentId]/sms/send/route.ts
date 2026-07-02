import { NextResponse } from 'next/server';

import { getAgentPhoneNumber, getOrCreateSmsThread, saveSmsMessage } from '@/lib/agents/phone-service';
import { getTwilioRestClient } from '@/lib/twilio-client';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function POST(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = (await request.json()) as { to: string; message: string; threadId?: string };
    const to = body.to?.trim();
    const messageBody = body.message?.trim();
    if (!to || !messageBody) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 });
    }

    const agentPhone = (await getAgentPhoneNumber(agentId)) ?? '';
    if (!agentPhone) {
      return NextResponse.json(
        { error: 'No phone number assigned to this agent' },
        { status: 400 },
      );
    }

    const client = await getTwilioRestClient();
    const sent = await client.messages.create({
      to,
      from: agentPhone,
      body: messageBody,
    });

    const thread = await getOrCreateSmsThread(agentId, to, agentPhone);
    const message = await saveSmsMessage(thread.id, 'outbound', messageBody, sent.sid);

    return NextResponse.json({ ok: true, messageSid: sent.sid, messageId: message.id, threadId: thread.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send SMS' },
      { status: 500 },
    );
  }
}
