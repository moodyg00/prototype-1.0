'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../src/providers/theme-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { mode, setMode } = useTheme();

  const isDark = mode === 'dark';

  const toggleDarkMode = () => {
    setMode(isDark ? 'light' : 'dark');
    setUserMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div id="admin-main-column" className="relative flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-border/50 bg-card/80 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="-ml-2 rounded-md p-2 transition-colors hover:bg-muted lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="admin-eyebrow">Proto-2 · Full Admin Layer</div>
          </div>

          <div className="relative text-sm">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center rounded-full transition-all hover:ring-2 hover:ring-primary/30"
              aria-label="User menu"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                JD
              </div>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border/50 bg-card py-1 shadow-lg">
                <div className="border-b border-border/40 px-4 py-3">
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-muted-foreground">john@doe.com</div>
                </div>

                <div className="py-1">
                  <button
                    onClick={toggleDarkMode}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
                  </button>

                  <button
                    onClick={() => {
                      alert('Logout (demo - no logic yet)');
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}