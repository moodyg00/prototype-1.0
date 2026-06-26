import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type GlanceItem = { label: string; time: string };

// @mock-start
const MOCK_GLANCE_ITEMS: GlanceItem[] = [
  { label: 'Vertex Labs — rooftop inspection', time: '13:00' },
  { label: 'Northwind — plumbing call-out', time: '15:30' },
  { label: 'Acme Holdings — quarterly audit', time: '17:00' },
];
// @mock-end

export interface CardBasicSurfaceProps {
  glanceItems?: ReadonlyArray<GlanceItem>;
}

export function CardBasicSurface({ glanceItems = MOCK_GLANCE_ITEMS }: CardBasicSurfaceProps) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Proto-2</CardTitle>
          <CardDescription>
            A premium operating system where humans and AI agents work the same business stack.
          </CardDescription>
        </CardHeader>
        <CardContent style={{ color: 'var(--muted-foreground)' }}>
          <p className="text-sm leading-relaxed">
            The simplest possible surface: a soft border, a clear title, a one-line description, and
            body copy. Use this when nothing more is needed.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today at a glance</CardTitle>
          <CardDescription>
            5 jobs scheduled · 2 invoices pending · 1 contract draft
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {glanceItems.map((item) => (
              <li key={item.label} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
