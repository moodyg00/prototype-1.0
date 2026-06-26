import { NextResponse } from 'next/server';

import { getAdminDashboardKpis } from '@/src/lib/admin/dashboard-kpis';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

export async function GET() {
  try {
    const dashboardKpis = await getAdminDashboardKpis();
    return NextResponse.json(dashboardKpis);
  } catch (error) {
    return handleRouteError(error);
  }
}
