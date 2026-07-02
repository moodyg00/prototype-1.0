import { NextResponse } from 'next/server';

import { getAgentPhoneNumber, setAgentPhoneNumber } from '@/lib/agents/phone-service';
import { getTwilioConfig, upsertTwilioIntegration } from '@/lib/twilio-client';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const [config, phoneNumber] = await Promise.all([
      getTwilioConfig(),
      getAgentPhoneNumber(agentId),
    ]);
    return NextResponse.json({
      twilioAccountSid: config?.accountSid
        ? `${config.accountSid.slice(0, 6)}...${config.accountSid.slice(-4)}`
        : undefined,
      twilioAuthTokenConfigured: !!(config?.authToken),
      twilioPhoneNumber: phoneNumber ?? undefined,
      isConfigured: !!(config && phoneNumber),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load phone config' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = (await request.json()) as {
      accountSid?: string;
      authToken?: string;
      phoneNumber?: string;
    };
    const accountSid = body.accountSid?.trim();
    const authToken = body.authToken?.trim();
    const phoneNumber = body.phoneNumber?.trim();

    if (accountSid && authToken) {
      await upsertTwilioIntegration(accountSid, authToken);
    }
    if (phoneNumber) {
      await setAgentPhoneNumber(agentId, phoneNumber);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save phone config' },
      { status: 500 },
    );
  }
}
