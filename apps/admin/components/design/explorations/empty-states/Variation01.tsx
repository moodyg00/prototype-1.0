import { Inbox, Plus } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface EmptyStateClassicProps {}

export function EmptyStateClassic(_props: EmptyStateClassicProps = {}) {
  return (
    <div className="px-6">
      <Empty>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Your inbox is empty</EmptyTitle>
          <EmptyDescription>
            No new messages to triage right now. New work will appear here as soon as it lands —
            from forms, integrations, or your team.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Compose new
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
