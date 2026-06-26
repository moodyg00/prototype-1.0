import { Sparkles, ArrowUp, AtSign, Paperclip } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// @mock-start
const MOCK_SUGGESTIONS: string[] = [
  'Draft an invoice for the last completed job',
  'Summarize overdue receivables',
  'Find every work order without an assigned tech',
  'Compare this month\u2019s revenue to last month',
];
// @mock-end

export interface EmptyStateAgentPromptProps {
  suggestions?: ReadonlyArray<string>;
}

export function EmptyStateAgentPrompt({
  suggestions = MOCK_SUGGESTIONS,
}: EmptyStateAgentPromptProps = {}) {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="relative">
          <div
            className="grid size-12 place-items-center rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--background) 60%))',
              color: 'white',
            }}
          >
            <Sparkles className="size-5" />
          </div>
          <div
            className="absolute inset-0 -z-10 rounded-2xl blur-xl"
            style={{
              background: 'color-mix(in srgb, var(--primary) 40%, transparent)',
            }}
          />
        </div>

        <h3 className="mt-5 font-heading font-semibold text-2xl">Nothing here yet</h3>
        <p className="mt-1 max-w-md text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Ask the agent for help getting started. It can pull data, draft documents, or set up
          workflows — and you stay in control of every action.
        </p>

        <div className="mt-6 w-full max-w-xl">
          <InputGroup>
            <InputGroupAddon>
              <Sparkles style={{ color: 'var(--primary)' }} />
            </InputGroupAddon>
            <InputGroupInput placeholder="Ask the agent to do something..." />
            <InputGroupAddon align="inline-end">
              <Button variant="ghost" size="icon-sm" aria-label="Attach">
                <Paperclip className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Mention">
                <AtSign className="size-3.5" />
              </Button>
              <Button size="icon-sm" aria-label="Send">
                <ArrowUp className="size-3.5" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
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
      </div>
    </div>
  );
}
