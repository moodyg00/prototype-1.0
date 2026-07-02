import Twilio from 'twilio';

import { prisma } from '@/lib/prisma';

export type TwilioConfig = {
  accountSid: string;
  authToken: string;
};

export async function getTwilioConfig(): Promise<TwilioConfig | null> {
  if (prisma) {
    try {
      const integration = await prisma.integration.findFirst({
        where: { provider: 'twilio', status: 'active' },
        select: { apiKey: true, apiSecret: true },
      });
      if (integration?.apiKey && integration?.apiSecret) {
        return { accountSid: integration.apiKey, authToken: integration.apiSecret };
      }
    } catch {
      // fall through to env vars
    }
  }
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (accountSid && authToken) {
    return { accountSid, authToken };
  }
  return null;
}

export async function upsertTwilioIntegration(
  accountSid: string,
  authToken: string,
): Promise<void> {
  if (!prisma) throw new Error('No DB');
  const existing = await prisma.integration.findFirst({
    where: { provider: 'twilio' },
    select: { id: true },
  });
  if (existing) {
    await prisma.integration.update({
      where: { id: existing.id },
      data: { apiKey: accountSid, apiSecret: authToken, status: 'active' },
    });
  } else {
    await prisma.integration.create({
      data: {
        name: 'Twilio',
        type: 'api',
        provider: 'twilio',
        authType: 'basic',
        apiKey: accountSid,
        apiSecret: authToken,
        status: 'active',
        environment: 'production',
      },
    });
  }
}

export async function getTwilioRestClient() {
  const config = await getTwilioConfig();
  if (!config) {
    throw new Error(
      'Twilio not configured. Add credentials in the Phone pane or set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN env vars.',
    );
  }
  return Twilio(config.accountSid, config.authToken);
}
