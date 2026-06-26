import { Inbox, Bell, Search, Sparkles, Star, GitPullRequest } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Kbd, KbdGroup } from '@/components/ui/kbd';

// @mock-start
// @mock-end

export interface ButtonBadgeShortcutProps {}

export function ButtonBadgeShortcut(_props: ButtonBadgeShortcutProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          With counter badge
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline">
            <Inbox />
            Inbox
            <Badge variant="default" size="sm" className="ms-1">
              12
            </Badge>
          </Button>
          <Button variant="outline">
            <GitPullRequest />
            Pull requests
            <Badge variant="secondary" size="sm" className="ms-1">
              4
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell />
            <Badge
              variant="default"
              size="sm"
              className="-right-1 -top-1 absolute h-3.5 min-w-3.5 px-1 text-[9px]"
            >
              3
            </Badge>
          </Button>
          <Button variant="outline">
            <Star />
            Starred
            <Badge variant="outline" size="sm" className="ms-1 font-normal">
              28
            </Badge>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          With keyboard shortcut
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline">
            <Search />
            Quick search
            <KbdGroup className="ms-2">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
          <Button>
            <Sparkles />
            Ask agent
            <Kbd className="ms-2 bg-white/16 text-white">⌘J</Kbd>
          </Button>
          <Button variant="ghost">
            New
            <Kbd className="ms-2">N</Kbd>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          CTA card with status pill
        </div>
        <Button
          variant="outline"
          className="h-auto items-start justify-start gap-3 px-3 py-2.5 text-left"
        >
          <span
            className="grid size-8 shrink-0 place-items-center rounded-md"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Sparkles className="size-4" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 font-medium text-sm">
              Run weekly report
              <Badge variant="info" size="sm">
                Beta
              </Badge>
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Summarises ops + revenue across 7 days using your live data
            </span>
          </span>
        </Button>
      </div>
    </div>
  );
}
