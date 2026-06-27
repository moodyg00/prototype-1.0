import {
  Sparkles,
  ArrowUp,
  Paperclip,
  AtSign,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

// @mock-start
const MOCK_SUGGESTIONS = [
  'Summarize work orders due this week',
  'Draft an invoice for Vertex Labs',
  'Show overdue receivables',
];
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_BRAND_TAGLINE = 'Agent-native admin';
const MOCK_PROMPT_PLACEHOLDER = 'Ask the agent anything about your business...';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderAgentPromptProps {
  suggestions?: ReadonlyArray<string>;
  brandName?: string;
  brandTagline?: string;
  promptPlaceholder?: string;
  userInitials?: string;
}

export function HeaderAgentPrompt({
  suggestions = MOCK_SUGGESTIONS,
  brandName = MOCK_BRAND_NAME,
  brandTagline = MOCK_BRAND_TAGLINE,
  promptPlaceholder = MOCK_PROMPT_PLACEHOLDER,
  userInitials = MOCK_USER_INITIALS,
}: HeaderAgentPromptProps) {
  return (
    <header
      className="flex w-full flex-col gap-2 px-6 pb-3 pt-3"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="grid size-7 place-items-center rounded-md"
            style={{
              background:
                'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 50%, var(--background) 50%))',
            }}
          >
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{brandName}</div>
            <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {brandTagline}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <InputGroup>
            <InputGroupAddon>
              <Sparkles style={{ color: 'var(--primary)' }} />
            </InputGroupAddon>
            <InputGroupInput placeholder={promptPlaceholder} />
            <InputGroupAddon align="inline-end">
              <Button variant="ghost" size="icon-sm" aria-label="Attach">
                <Paperclip className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Mention record">
                <AtSign className="size-3.5" />
              </Button>
              <Button size="icon-sm" aria-label="Send">
                <ArrowUp className="size-3.5" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Avatar className="size-8">
            <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
          Try
        </span>
        {suggestions.map((s) => (
          <Badge
            key={s}
            variant="outline"
            size="sm"
            render={<button type="button" />}
            className="cursor-pointer font-normal"
          >
            {s}
          </Badge>
        ))}
      </div>
    </header>
  );
}
