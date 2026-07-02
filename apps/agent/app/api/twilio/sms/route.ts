import {
  findAgentIdByPhoneNumber,
  getOrCreateSmsThread,
  saveSmsMessage,
} from '@/lib/agents/phone-service';
import { generateBrainResponse } from '@/lib/agents/brain-service';
import { getWorkspaceAgent } from '@/lib/agents/registry-store';
import { getTwilioConfig } from '@/lib/twilio-client';

export const runtime = 'nodejs';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function twimlMessage(body: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(request: Request) {
  // Parse URL-encoded body from Twilio
  const text = await request.text();
  const params: Record<string, string> = {};
  new URLSearchParams(text).forEach((v, k) => {
    params[k] = v;
  });

  // Validate Twilio signature
  const config = await getTwilioConfig();
  if (config?.authToken) {
    const signature = request.headers.get('x-twilio-signature') ?? '';
    const { default: twilio } = await import('twilio');
    // Reconstruct URL from forwarded headers for deployments behind a reverse proxy
    const proto =
      process.env.TWILIO_WEBHOOK_BASE_URL
        ? ''
        : (request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', ''));
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
    const path = new URL(request.url).pathname;
    const url = process.env.TWILIO_WEBHOOK_BASE_URL
      ? `${process.env.TWILIO_WEBHOOK_BASE_URL}${path}`
      : `${proto}://${host}${path}`;
    const valid = twilio.validateRequest(config.authToken, signature, url, params);
    if (!valid && process.env.NODE_ENV !== 'development') {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const to = params['To'];
  const from = params['From'];
  const body = params['Body'];
  const messageSid = params['MessageSid'];

  if (!to || !from || !body) {
    return new Response('Missing params', { status: 400 });
  }

  // Find the agent assigned to this phone number
  const agentId = await findAgentIdByPhoneNumber(to);
  if (!agentId) {
    return twimlMessage("This number isn't linked to an active agent.");
  }

  // Persist thread + inbound message
  let thread;
  try {
    thread = await getOrCreateSmsThread(agentId, from, to);
    await saveSmsMessage(thread.id, 'inbound', body, messageSid);
  } catch {
    return twimlMessage("Message received but couldn't be saved.");
  }

  // Generate AI reply
  let replyText = '';
  try {
    const agent = await getWorkspaceAgent(agentId);
    if (agent) {
      replyText = await generateBrainResponse(agent, body);
    } else {
      replyText = "I'm not available right now. Please try again later.";
    }
  } catch {
    replyText = "I'm unable to respond at the moment.";
  }

  // Persist outbound reply
  try {
    await saveSmsMessage(thread.id, 'outbound', replyText);
  } catch {
    // non-fatal — still send the reply
  }

  return twimlMessage(replyText);
}
