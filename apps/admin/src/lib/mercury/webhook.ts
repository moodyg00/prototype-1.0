import crypto from 'node:crypto';

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

export function verifyMercuryWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secretKey: string,
): boolean {
  if (!signatureHeader?.trim() || !secretKey.trim()) {
    return false;
  }

  const parts = signatureHeader.split(',');
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signature = parts.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > MAX_WEBHOOK_AGE_SECONDS) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(signedPayload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
