import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { generateAccountingReport } from '@/src/lib/accounting/reports/generate-report';
import { accountingReportGenerateSchema } from '@/src/lib/validation/accounting-report';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const parsed = accountingReportGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(422, parsed.error.issues[0]?.message ?? 'Invalid report request.');
    }

    const report = await generateAccountingReport(parsed.data);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message.includes('CSV export is not available')) {
      return jsonError(422, error.message);
    }
    return handleRouteError(error);
  }
}
