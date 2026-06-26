import { X, User, Bell, Lock, Plug, CreditCard, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

type Tab = { icon: LucideIcon; label: string; active?: boolean };
type Pref = { label: string; detail: string; on: boolean };

// @mock-start
const MOCK_TABS: Tab[] = [
  { icon: User, label: 'Account' },
  { icon: Bell, label: 'Notifications', active: true },
  { icon: Lock, label: 'Security' },
  { icon: Plug, label: 'Integrations' },
  { icon: CreditCard, label: 'Billing' },
  { icon: Users, label: 'Team' },
];

const MOCK_PREFS: Pref[] = [
  {
    label: 'Daily digest email',
    detail: 'Summary of new leads, tasks, and overdue items at 8 AM.',
    on: true,
  },
  {
    label: 'Mention notifications',
    detail: 'When a teammate or agent @mentions you anywhere.',
    on: true,
  },
  {
    label: 'Invoice paid',
    detail: 'Push notification on every successful payment.',
    on: false,
  },
  {
    label: 'Agent task completed',
    detail: 'Notify whenever an automation finishes or fails.',
    on: true,
  },
];
// @mock-end

export interface DialogSidebarTabsProps {
  tabs?: ReadonlyArray<Tab>;
  prefs?: ReadonlyArray<Pref>;
}

export function DialogSidebarTabs({
  tabs = MOCK_TABS,
  prefs = MOCK_PREFS,
}: DialogSidebarTabsProps) {
  return (
    <div
      className="relative grid place-items-center px-6 py-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="flex w-full max-w-3xl overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)', height: 460 }}
      >
        <aside
          className="flex w-56 shrink-0 flex-col border-r"
          style={{
            borderColor: 'var(--border)',
            background: 'color-mix(in srgb, var(--muted) 60%, var(--card) 40%)',
          }}
        >
          <div
            className="border-b px-5 py-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="font-semibold text-sm tracking-tight">Settings</div>
            <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              Manage your workspace
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 p-2">
            {tabs.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors"
                style={
                  active
                    ? { background: 'var(--card)', color: 'var(--foreground)', fontWeight: 500 }
                    : { color: 'var(--muted-foreground)' }
                }
              >
                <Icon className="size-4 opacity-80" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <div
            className="flex items-center justify-between gap-3 border-b px-6 py-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <div className="font-semibold text-base tracking-tight">Notifications</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Choose what we tell you about, and where.
              </div>
            </div>
            <button
              type="button"
              className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
              aria-label="Close"
            >
              <X className="size-4" style={{ color: 'var(--muted-foreground)' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <ul className="space-y-4">
              {prefs.map((pref) => (
                <li key={pref.label} className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm">{pref.label}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {pref.detail}
                    </div>
                  </div>
                  <Switch defaultChecked={pref.on} />
                </li>
              ))}
            </ul>
          </div>

          <div
            className="flex items-center justify-end gap-2 border-t px-6 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
