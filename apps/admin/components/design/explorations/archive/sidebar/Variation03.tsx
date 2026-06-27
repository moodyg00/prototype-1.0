import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Server,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type RailItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type AccountInfo = {
  initials: string;
  name: string;
};

// @mock-start
const MOCK_ITEMS: RailItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Work Orders', icon: Briefcase, active: true },
  { label: 'Contacts', icon: Users },
  { label: 'Invoices', icon: CreditCard },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Ads', icon: Megaphone },
  { label: 'Integrations', icon: Server },
];
const MOCK_FOOTER: RailItem[] = [
  { label: 'Help center', icon: LifeBuoy },
  { label: 'Settings', icon: Settings },
];
const MOCK_ACCOUNT: AccountInfo = { initials: 'JD', name: 'Jordan Dahl' };
// @mock-end

export interface SidebarIconRailProps {
  items?: ReadonlyArray<RailItem>;
  footer?: ReadonlyArray<RailItem>;
  account?: AccountInfo;
}

export function SidebarIconRail({
  items = MOCK_ITEMS,
  footer = MOCK_FOOTER,
  account = MOCK_ACCOUNT,
}: SidebarIconRailProps) {
  return (
    <TooltipProvider delay={120}>
      <div className="flex min-h-[520px] w-full">
        <aside
          className="flex w-14 shrink-0 flex-col items-center py-3"
          style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
        >
          <div
            className="grid size-9 place-items-center rounded-lg font-bold text-white text-xs"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>

          <div
            className="my-3 h-px w-6"
            style={{ background: 'var(--border)' }}
          />

          <nav className="flex flex-1 flex-col items-center gap-1.5">
            {items.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={item.label}
                      className="grid size-9 place-items-center rounded-lg transition-colors"
                      style={
                        item.active
                          ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                          : { color: 'var(--muted-foreground)' }
                      }
                    />
                  }
                >
                  <item.icon className="size-4" />
                </TooltipTrigger>
                <TooltipPopup side="right" sideOffset={8}>
                  {item.label}
                </TooltipPopup>
              </Tooltip>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-1.5 pt-2">
            {footer.map((item) => (
              <Tooltip key={item.label}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={item.label}
                      className="grid size-9 place-items-center rounded-lg transition-colors hover:bg-[var(--muted)]"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                  }
                >
                  <item.icon className="size-4" />
                </TooltipTrigger>
                <TooltipPopup side="right" sideOffset={8}>
                  {item.label}
                </TooltipPopup>
              </Tooltip>
            ))}

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account"
                    className="mt-1 rounded-full"
                  />
                }
              >
                <Avatar className="size-9">
                  <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{account.initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipPopup side="right" sideOffset={8}>
                {account.name}
              </TooltipPopup>
            </Tooltip>
          </div>
        </aside>

        <div
          className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Mini rail — labels appear on hover
        </div>
      </div>
    </TooltipProvider>
  );
}
