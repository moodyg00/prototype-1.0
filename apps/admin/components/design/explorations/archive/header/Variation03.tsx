import * as React from 'react';
import { ChevronRight, MoreHorizontal, Bell, Search, Settings, LogOut, User } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { Button } from '@/components/ui/button';

type Crumb = {
  label: string;
  href?: string;
  current?: boolean;
  mono?: boolean;
};

// @mock-start
const MOCK_CRUMBS: Crumb[] = [
  { label: 'Proto-2', href: '#' },
  { label: 'Operations', href: '#' },
  { label: 'Work Orders', href: '#' },
  { label: 'WO-4821', current: true, mono: true },
];
// @mock-end

export interface HeaderMonolineBreadcrumbProps {
  crumbs?: ReadonlyArray<Crumb>;
}

export function HeaderMonolineBreadcrumb({
  crumbs = MOCK_CRUMBS,
}: HeaderMonolineBreadcrumbProps) {
  return (
    <header
      className="flex h-11 w-full items-center gap-4 px-5"
      style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}
    >
      <div
        className="size-2 rounded-full"
        style={{ background: 'var(--primary)' }}
        aria-hidden="true"
      />

      <Breadcrumb>
        <BreadcrumbList className="text-xs">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                <BreadcrumbItem>
                  {crumb.current ? (
                    <BreadcrumbPage className={crumb.mono ? 'font-mono text-[11px]' : undefined}>
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href ?? '#'} className={idx === 0 ? 'font-medium' : undefined}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Search">
          <Search className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell className="size-3.5" />
        </Button>
        <Menu>
          <MenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}
          >
            <MoreHorizontal className="size-3.5" />
          </MenuTrigger>
          <MenuPopup align="end" className="w-44">
            <MenuItem>
              <User /> Profile
            </MenuItem>
            <MenuItem>
              <Settings /> Settings
            </MenuItem>
            <MenuSeparator />
            <MenuItem variant="destructive">
              <LogOut /> Sign out
            </MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    </header>
  );
}
