import { Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface CardMediaLedProps {}

export function CardMediaLed(_props: CardMediaLedProps = {}) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <Card className="overflow-hidden p-0">
        <div
          className="relative h-32 w-full"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 40%, var(--background) 60%))',
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--background) 60%, transparent) 0, transparent 50%), radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--background) 60%, transparent) 0, transparent 50%)',
            }}
          />
          <div className="relative flex h-full items-end p-5">
            <Badge variant="outline" size="sm" className="bg-white/16 text-white" style={{ borderColor: 'rgba(255,255,255,0.32)' }}>
              <Sparkles className="size-3" /> Beta
            </Badge>
          </div>
        </div>
        <CardHeader>
          <CardTitle>Agent workspace</CardTitle>
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Spin up a private AI workspace that can read your CRM, draft emails, and trigger
            workflows on your behalf — with you reviewing every action.
          </div>
        </CardHeader>
        <CardFooter className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Free during preview
          </span>
          <Button size="sm" className="gap-1.5">
            Try it <ArrowRight className="size-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden p-0">
        <div
          className="grid h-32 place-items-center"
          style={{
            background:
              'repeating-linear-gradient(45deg, var(--muted), var(--muted) 8px, color-mix(in srgb, var(--card) 80%, var(--primary-soft) 20%) 8px, color-mix(in srgb, var(--card) 80%, var(--primary-soft) 20%) 16px)',
          }}
        >
          <div
            className="rounded-lg border px-3 py-1.5 font-mono text-xs"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            INV-1042 · $8,400
          </div>
        </div>
        <CardHeader>
          <CardTitle>Invoice INV-1042</CardTitle>
          <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Drafted for Vertex Labs on May 28. Awaiting your approval before sending.
          </div>
        </CardHeader>
        <CardFooter className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm">Preview</Button>
          <Button size="sm">Approve & send</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
