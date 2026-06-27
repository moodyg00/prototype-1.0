import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'error'
  | 'destructive';

type Person = {
  id?: string;
  name: string;
  initials: string;
  role: string;
  email?: string;
  phone?: string;
  city?: string;
  status?: {
    label: string;
    variant?: BadgeVariant;
  };
};

export interface RecordCardProps {
  people: ReadonlyArray<Person>;
  profileBasePath?: string;
}

export function RecordCard({ people, profileBasePath }: RecordCardProps) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      {people.map((p) => (
        <article key={p.id ?? p.name} className="admin-surface p-5">
          <div className="flex items-start gap-3">
            <Avatar className="size-11">
              <AvatarFallback style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                {p.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{p.name}</div>
              <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {p.role}
              </div>
            </div>
            {p.status ? (
              <Badge variant={p.status.variant ?? 'outline'} size="sm" className="capitalize">
                {p.status.label}
              </Badge>
            ) : null}
          </div>

          {p.email || p.phone || p.city ? (
            <dl className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {p.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5" />
                  <span className="truncate">{p.email}</span>
                </div>
              ) : null}
              {p.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5" />
                  <span>{p.phone}</span>
                </div>
              ) : null}
              {p.city ? (
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5" />
                  <span>{p.city}</span>
                </div>
              ) : null}
            </dl>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1">Message</Button>
            {profileBasePath && p.id ? (
              <Link
                href={`${profileBasePath.replace(/\/$/, '')}/${p.id}`}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'flex-1')}
              >
                View profile
              </Link>
            ) : (
              <Button variant="ghost" size="sm" className="flex-1" disabled>
                View profile
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
