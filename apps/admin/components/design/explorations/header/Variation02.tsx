import { Search, Bell, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

// @mock-start
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_SEARCH_PROMPT =
  'Search anything in the business — work orders, contacts, invoices, or ask the agent';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderCommandBarProps {
  brandName?: string;
  searchPrompt?: string;
  userInitials?: string;
}

export function HeaderCommandBar({
  brandName = MOCK_BRAND_NAME,
  searchPrompt = MOCK_SEARCH_PROMPT,
  userInitials = MOCK_USER_INITIALS,
}: HeaderCommandBarProps) {
  return (
    <header
      className="flex h-16 w-full items-center gap-4 px-6"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="grid size-7 place-items-center rounded-full"
          style={{
            background:
              'conic-gradient(from 210deg, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--background) 60%))',
          }}
        >
          <Sparkles className="size-3.5 text-white" />
        </div>
        <div className="hidden font-semibold text-sm tracking-tight sm:block">{brandName}</div>
      </div>

      <button
        type="button"
        className="group mx-auto flex h-10 w-full max-w-2xl items-center gap-3 rounded-full border px-5 text-left transition-all hover:shadow-md"
        style={{
          background: 'color-mix(in srgb, var(--background) 70%, var(--muted) 30%)',
          borderColor: 'var(--border)',
        }}
      >
        <Search className="size-4" style={{ color: 'var(--muted-foreground)' }} />
        <span className="flex-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {searchPrompt}
        </span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Avatar className="size-8 ring-2" style={{ ['--tw-ring-color' as string]: 'var(--primary-soft)' }}>
          <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
