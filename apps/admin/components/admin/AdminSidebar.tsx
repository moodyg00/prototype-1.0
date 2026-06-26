'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from '../../src/config/navigation';
import { X } from 'lucide-react';

export function AdminSidebar({ 
  isOpen = true, 
  onClose 
}: { 
  isOpen?: boolean; 
  onClose?: () => void 
}) {
  const pathname = usePathname();

  const sidebarClass = `
    w-64 h-screen overflow-y-auto transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    fixed inset-y-0 left-0 z-50 lg:sticky lg:translate-x-0 lg:top-0 lg:z-auto lg:block
  `;

  return (
    <aside
      className={sidebarClass}
      style={{
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Mobile header with close */}
      <div className="lg:hidden flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-semibold text-xl tracking-tight">Proto-2</div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-lg hover:bg-[var(--muted)]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="font-semibold text-xl tracking-tight">Proto-2</div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Business OS
        </div>
      </div>

      <nav className="p-2 text-sm">
        {NAV_GROUPS.map((group) => {
          const items = [...group.items].sort((a, b) => a.sort - b.sort);
          return (
            <div key={group.label} className="mb-4">
              <div
                className="px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.label}
              </div>
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
                      // Auto-close on mobile after navigation
                      if (window.innerWidth < 1024 && onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-colors"
                    style={
                      active
                        ? {
                            background: 'var(--primary-soft)',
                            color: 'var(--primary)',
                            fontWeight: 500,
                          }
                        : { color: 'var(--foreground)' }
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div
        className="p-4 mt-auto text-[11px] hidden lg:block"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
      >
        Operational quick reference · Business Lab lives in the companion app
      </div>
    </aside>
  );
}
