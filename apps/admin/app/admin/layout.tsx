'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Menu, X, User, LogOut, Sun, Moon } from 'lucide-react';
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
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div id="admin-main-column" className="relative flex min-h-screen flex-1 min-w-0 flex-col">
        <header
          className="h-14 flex items-center px-4 lg:px-6 justify-between"
          style={{
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Proto-2 · Full Admin Layer
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center rounded-full hover:ring-2 hover:ring-[var(--primary)] transition-all"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-semibold">
                  JD
                </div>
              </button>

              {userMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl border shadow-xl py-1 z-50"
                  style={{ 
                    background: 'var(--card)', 
                    borderColor: 'var(--border)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="font-medium text-sm">John Doe</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>john@doe.com</div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
                    </button>

                    <button
                      onClick={() => {
                        alert('Logout (demo - no logic yet)');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--muted)] text-red-500 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
