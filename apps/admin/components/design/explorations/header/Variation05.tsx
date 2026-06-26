import { Search, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Kbd } from '@/components/ui/kbd';

// @mock-start
const MOCK_PILL_NAV = ['Home', 'Operations', 'Clients', 'Reports'];
const MOCK_BRAND_INITIALS = 'P2';
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderFloatingPillProps {
  nav?: ReadonlyArray<string>;
  brandInitials?: string;
  brandName?: string;
  userInitials?: string;
}

export function HeaderFloatingPill({
  nav = MOCK_PILL_NAV,
  brandInitials = MOCK_BRAND_INITIALS,
  brandName = MOCK_BRAND_NAME,
  userInitials = MOCK_USER_INITIALS,
}: HeaderFloatingPillProps) {
  return (
    <header
      className="w-full px-4 py-3"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="mx-auto flex h-12 max-w-6xl items-center gap-2 rounded-full border px-2 shadow-sm"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 ps-2">
          <div
            className="grid size-7 place-items-center rounded-full font-bold text-white text-[11px]"
            style={{ background: 'var(--primary)' }}
          >
            {brandInitials}
          </div>
          <span className="hidden font-semibold text-sm tracking-tight md:inline">{brandName}</span>
        </div>

        <div className="mx-1 hidden h-5 w-px self-center md:block" style={{ background: 'var(--border)' }} />

        <nav className="hidden items-center gap-0.5 md:flex">
          {nav.map((item, i) => (
            <button
              key={item}
              type="button"
              className="h-8 rounded-full px-3 text-sm transition-colors"
              style={
                i === 0
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="ml-auto flex h-8 items-center gap-2 rounded-full border px-3 transition-colors hover:bg-[var(--muted)]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Search className="size-3.5" />
          <span className="hidden text-xs sm:inline">Search</span>
          <Kbd className="hidden text-[10px] sm:inline-flex">⌘K</Kbd>
        </button>

        <Button size="sm" className="h-8 gap-1.5 rounded-full">
          <Sparkles className="size-3.5" />
          Ask agent
        </Button>

        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Notifications">
          <Bell className="size-3.5" />
        </Button>

        <Avatar className="size-8 me-0.5">
          <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
