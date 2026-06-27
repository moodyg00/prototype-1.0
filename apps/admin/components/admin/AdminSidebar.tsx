'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from '../../src/config/navigation';
import { X } from 'lucide-react';

export function AdminSidebar({
  isOpen = true,
  onClose,
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const sidebarClass = `
    w-60 h-screen overflow-y-auto transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    fixed inset-y-0 left-0 z-50 lg:sticky lg:translate-x-0 lg:top-0 lg:z-auto lg:block
  `;

  return (
    <aside
      className={sidebarClass}
      style={{
        background: 'var(--card)',
        borderRight: '1px solid color-mix(in srgb, var(--border) 50%, transparent)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-4 lg:block"
        style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 40%, transparent)' }}
      >
        <div>
          <div className="font-display text-lg font-medium tracking-tight">Proto-2</div>
          <div className="admin-eyebrow mt-0.5">Business OS</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-2 hover:bg-muted lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="px-2 py-3 text-sm">
        {NAV_GROUPS.map((group) => {
          const items = [...group.items].sort((a, b) => a.sort - b.sort);
          return (
            <div key={group.label} className="mb-5">
              <div className="admin-eyebrow px-3 py-1.5">{group.label}</div>
              {items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  item.match?.includes(pathname) ||
                  (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onClose) onClose();
                    }}
                    className="mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors"
                    style={
                      active
                        ? {
                            background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                            color: 'var(--primary)',
                            fontWeight: 500,
                          }
                        : { color: 'var(--foreground)' }
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div
        className="mt-auto hidden px-4 py-4 text-[11px] leading-relaxed lg:block"
        style={{
          borderTop: '1px solid color-mix(in srgb, var(--border) 40%, transparent)',
          color: 'var(--muted-foreground)',
        }}
      >
        Operational quick reference · Business Lab lives in the companion app
      </div>
    </aside>
  );
}