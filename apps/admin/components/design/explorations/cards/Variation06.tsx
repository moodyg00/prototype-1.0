import { Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Person = {
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'invited' | 'paused';
};

// @mock-start
const MOCK_PEOPLE: Person[] = [
  { name: 'Janet Doe', initials: 'JD', role: 'Operations lead', email: 'janet@vertex.io', phone: '+1 (415) 555-2200', city: 'San Francisco', status: 'active' },
  { name: 'Maya Liu', initials: 'ML', role: 'Senior tech', email: 'maya@vertex.io', phone: '+1 (415) 555-7711', city: 'Oakland', status: 'paused' },
  { name: 'Reza Patel', initials: 'RP', role: 'Field engineer', email: 'reza@vertex.io', phone: '+1 (415) 555-3340', city: 'Daly City', status: 'invited' },
];
// @mock-end

const STATUS_VARIANT = { active: 'success', invited: 'info', paused: 'warning' } as const;

export interface CardAvatarRecordProps {
  people?: ReadonlyArray<Person>;
}

export function CardAvatarRecord({ people = MOCK_PEOPLE }: CardAvatarRecordProps) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      {people.map((p) => (
        <Card key={p.name} className="p-5">
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
            <Badge variant={STATUS_VARIANT[p.status]} size="sm" className="capitalize">
              {p.status}
            </Badge>
          </div>

          <dl className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-2">
              <Mail className="size-3.5" />
              <span className="truncate">{p.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-3.5" />
              <span>{p.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5" />
              <span>{p.city}</span>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1">Message</Button>
            <Button variant="ghost" size="sm" className="flex-1">View profile</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
