import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface CardBorderedFooterActionsProps {}

export function CardBorderedFooterActions(_props: CardBorderedFooterActionsProps = {}) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Discard draft invoice?</CardTitle>
          <CardDescription>
            Invoice INV-1042 for Vertex Labs hasn&apos;t been sent yet. Discarding will remove the
            draft and its attachments. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex items-center justify-end gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button variant="ghost" size="sm">Keep editing</Button>
          <Button variant="destructive" size="sm">Discard draft</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect your accounting</CardTitle>
          <CardDescription>
            Sync invoices, payments, and customers from QuickBooks or Xero. We pull data every 15
            minutes and never write back without your approval.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ color: 'var(--muted-foreground)' }}>
          <ul className="space-y-1 text-sm">
            <li>· Read-only OAuth scope</li>
            <li>· One-click disconnect at any time</li>
          </ul>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Takes about 2 minutes
          </span>
          <Button size="sm">Connect</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
