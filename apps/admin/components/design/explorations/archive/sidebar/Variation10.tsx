import {
  Sparkles,
  ArrowUp,
  Paperclip,
  AtSign,
  Briefcase,
  CreditCard,
  Users,
  FileText,
  History,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AgentTool = {
  label: string;
  icon: LucideIcon;
};

type AgentBrand = {
  name: string;
  status: string;
};

// @mock-start
const MOCK_TOOLS: AgentTool[] = [
  { label: 'Create work order', icon: Briefcase },
  { label: 'Draft invoice', icon: CreditCard },
  { label: 'Find a contact', icon: Users },
  { label: 'Summarize a doc', icon: FileText },
  { label: 'Forecast revenue', icon: TrendingUp },
];
const MOCK_RECENT_PROMPTS = [
  'Why is WO-1284 stuck in review?',
  'Send an invoice for Vertex Labs',
  'Top 5 overdue accounts',
];
const MOCK_BRAND: AgentBrand = {
  name: 'Proto-2 Agent',
  status: 'Online · Sonnet 4.6',
};
const MOCK_PROMPT_PLACEHOLDER = 'Ask anything…';
// @mock-end

export interface SidebarAgentPromptProps {
  tools?: ReadonlyArray<AgentTool>;
  recentPrompts?: ReadonlyArray<string>;
  brand?: AgentBrand;
  promptPlaceholder?: string;
}

export function SidebarAgentPrompt({
  tools = MOCK_TOOLS,
  recentPrompts = MOCK_RECENT_PROMPTS,
  brand = MOCK_BRAND,
  promptPlaceholder = MOCK_PROMPT_PLACEHOLDER,
}: SidebarAgentPromptProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-72 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center gap-2.5 px-4 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="grid size-8 place-items-center rounded-md"
            style={{
              background:
                'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 50%, var(--background)))',
            }}
          >
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{brand.name}</div>
            <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {brand.status}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-4">
            <div
              className="flex items-center gap-1.5 px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Sparkles className="size-3" />
              Tools
            </div>
            <ul className="flex flex-col gap-0.5">
              {tools.map((tool) => (
                <li key={tool.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
                  >
                    <tool.icon className="size-4" style={{ color: 'var(--primary)' }} />
                    {tool.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div
              className="flex items-center gap-1.5 px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <History className="size-3" />
              Recent prompts
            </div>
            <ul className="flex flex-col gap-1">
              {recentPrompts.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    className="line-clamp-1 w-full rounded-md px-2 py-1.5 text-start text-xs transition-colors hover:bg-[var(--muted)]"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <div
            className="rounded-xl border p-2"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--background)',
            }}
          >
            <div className="px-1 py-1 text-[12px]" style={{ color: 'var(--muted-foreground)' }}>
              {promptPlaceholder}
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon-xs" aria-label="Attach">
                  <Paperclip className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label="Mention">
                  <AtSign className="size-3.5" />
                </Button>
              </div>
              <Button size="icon-xs" aria-label="Send">
                <ArrowUp className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Agent-native sidebar — prompts and tools, no pages
      </div>
    </div>
  );
}
