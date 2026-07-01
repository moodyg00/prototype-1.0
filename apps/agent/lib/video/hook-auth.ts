export function assertVideoHookSecret(req: Request): void {
  const expected = process.env.VIDEO_WEBHOOK_SECRET?.trim();
  if (!expected) return;
  const header =
    req.headers.get('x-video-webhook-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (header !== expected) {
    throw new Error('Unauthorized');
  }
}