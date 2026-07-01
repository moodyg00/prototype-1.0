import { NextResponse } from 'next/server';
import { getBrowserOperator } from '@/lib/operators/BrowserOperator';

/** Polled by the Login tab of the Browser panel for credential prompts + session state. */
export async function GET() {
  try {
    const op = getBrowserOperator();
    return NextResponse.json({
      loginWindowOpen: op.getLoginWindowOpen(),
      credentialRequired: op.getCredentialRequired(),
      startupError: op.getStartupError(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
