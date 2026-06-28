import { NextResponse } from 'next/server';
import { getDeployConfig, testConnection } from '@/src/lib/deploy';

export const runtime = 'nodejs';

/**
 * Verifies the configured "live" SSH/SFTP target is reachable with key auth and
 * that the remote docroot exists. Use during setup (Phase 0) to confirm access.
 */
export async function GET() {
  try {
    const config = getDeployConfig('live');
    const probe = await testConnection('live');
    return NextResponse.json({
      ok: probe.ok,
      target: 'live',
      host: config.host,
      port: config.port,
      user: config.username,
      docroot: config.docroot,
      docrootExists: probe.docrootExists,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
