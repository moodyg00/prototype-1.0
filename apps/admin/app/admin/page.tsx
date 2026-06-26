import { AdminDashboard } from '@/src/components/admin/dashboard/AdminDashboard';
import { getAdminDashboardKpis } from '@/src/lib/admin/dashboard-kpis';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const dashboardKpis = await getAdminDashboardKpis();
  return <AdminDashboard dashboardKpis={dashboardKpis} />;
}
