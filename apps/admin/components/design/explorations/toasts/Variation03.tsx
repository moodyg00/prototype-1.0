import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type SemanticAlertVariant = 'success' | 'error' | 'warning' | 'info';

type SemanticAlertEntry = {
  variant: SemanticAlertVariant;
  icon: LucideIcon;
  title: string;
  description: string;
};

// @mock-start
const MOCK_ALERTS: SemanticAlertEntry[] = [
  {
    variant: 'success',
    icon: CheckCircle2,
    title: 'Payment received',
    description:
      'Acme Co. paid invoice INV-2041 via ACH. Funds should land in 1\u20132 business days.',
  },
  {
    variant: 'error',
    icon: XCircle,
    title: 'Sync failed',
    description:
      'QuickBooks returned 401 Unauthorized. Reconnect the integration to resume syncing.',
  },
  {
    variant: 'warning',
    icon: AlertTriangle,
    title: 'Quota almost reached',
    description:
      'You\u2019ve used 92% of this month\u2019s SMS credits. Top up before they run out.',
  },
  {
    variant: 'info',
    icon: Info,
    title: 'Heads up',
    description:
      'A new automation template, \u201cAuto-tag overdue invoices\u201d, is available in the library.',
  },
];
// @mock-end

export interface ToastSemanticSoftProps {
  alerts?: ReadonlyArray<SemanticAlertEntry>;
}

export function ToastSemanticSoft({ alerts = MOCK_ALERTS }: ToastSemanticSoftProps = {}) {
  return (
    <div className="space-y-3 px-6 py-6" style={{ background: 'var(--background)' }}>
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <Alert key={alert.title} variant={alert.variant}>
            <Icon />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
