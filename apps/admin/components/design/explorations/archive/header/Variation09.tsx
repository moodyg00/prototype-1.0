import {
  ChevronsUpDown,
  Activity,
  Search,
  GitBranch,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';

// @mock-start
const MOCK_WORKSPACE_INITIALS = 'SP';
const MOCK_WORKSPACE_NAME = 'Stonebridge Plumbing';
const MOCK_WORKSPACE_META = 'Workspace · Production';
const MOCK_ENVIRONMENT_LABEL = 'Production';
const MOCK_BRANCH_LABEL = 'main · 2f1a8c';
const MOCK_STATUS_MESSAGE = 'All systems operational';
const MOCK_STATUS_LATENCY = '14ms p95';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderContextStatusProps {
  workspaceInitials?: string;
  workspaceName?: string;
  workspaceMeta?: string;
  environmentLabel?: string;
  branchLabel?: string;
  statusMessage?: string;
  statusLatency?: string;
  userInitials?: string;
}

export function HeaderContextStatus({
  workspaceInitials = MOCK_WORKSPACE_INITIALS,
  workspaceName = MOCK_WORKSPACE_NAME,
  workspaceMeta = MOCK_WORKSPACE_META,
  environmentLabel = MOCK_ENVIRONMENT_LABEL,
  branchLabel = MOCK_BRANCH_LABEL,
  statusMessage = MOCK_STATUS_MESSAGE,
  statusLatency = MOCK_STATUS_LATENCY,
  userInitials = MOCK_USER_INITIALS,
}: HeaderContextStatusProps) {
  return (
    <header
      className="flex h-12 w-full items-center gap-3 px-4"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <button
        type="button"
        className="flex h-8 items-center gap-2 rounded-md border px-2 transition-colors hover:bg-[var(--muted)]"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="grid size-5 place-items-center rounded font-semibold text-white text-[10px]"
          style={{ background: 'var(--primary)' }}
        >
          {workspaceInitials}
        </div>
        <div className="leading-tight text-start">
          <div className="text-xs font-medium">{workspaceName}</div>
          <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
            {workspaceMeta}
          </div>
        </div>
        <ChevronsUpDown className="ms-1 size-3" style={{ color: 'var(--muted-foreground)' }} />
      </button>

      <div className="hidden items-center gap-1.5 md:flex">
        <Badge
          variant="success"
          size="sm"
          className="gap-1.5 rounded-full px-2"
        >
          <span className="size-1.5 rounded-full bg-current" />
          {environmentLabel}
        </Badge>
        <Badge
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full px-2 font-mono"
        >
          <GitBranch className="size-3" />
          {branchLabel}
        </Badge>
      </div>

      <div
        className="ms-2 hidden h-5 w-px self-center md:block"
        style={{ background: 'var(--border)' }}
      />

      <div
        className="hidden items-center gap-2 text-xs lg:flex"
        style={{ color: 'var(--muted-foreground)' }}
      >
        <Activity className="size-3.5" style={{ color: '#10b981' }} />
        <span>{statusMessage}</span>
        <span className="opacity-50">·</span>
        <span>{statusLatency}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="flex h-8 w-48 items-center gap-2 rounded-md border px-2 text-xs transition-colors hover:bg-[var(--muted)] xl:w-64"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-start">Search...</span>
          <Kbd>⌘K</Kbd>
        </button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <span className="relative inline-flex">
            <Bell className="size-4" />
            <span
              className="absolute right-0 top-0 size-1.5 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          </span>
        </Button>

        <Avatar className="size-7">
          <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
