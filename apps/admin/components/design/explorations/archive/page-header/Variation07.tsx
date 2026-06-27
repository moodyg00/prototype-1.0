import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Pencil, MoreHorizontal, Star } from 'lucide-react';

type ContactMeta = {
  email: string;
  phone: string;
  location: string;
  recordId: string;
};

// @mock-start
const MOCK_AVATAR_INITIALS = 'SP';
const MOCK_TITLE = 'Stonebridge Plumbing Co.';
const MOCK_STATUS_LABEL = 'Active';
const MOCK_FAVORITE_LABEL = 'Top customer';
const MOCK_CONTACT: ContactMeta = {
  email: 'ops@stonebridge.co',
  phone: '(503) 555-0142',
  location: 'Portland, OR',
  recordId: 'CUST-0042',
};
// @mock-end

export interface PageHeaderAvatarRecordProps {
  avatarInitials?: string;
  title?: string;
  statusLabel?: string;
  favoriteLabel?: string;
  contact?: ContactMeta;
}

export function PageHeaderAvatarRecord({
  avatarInitials = MOCK_AVATAR_INITIALS,
  title = MOCK_TITLE,
  statusLabel = MOCK_STATUS_LABEL,
  favoriteLabel = MOCK_FAVORITE_LABEL,
  contact = MOCK_CONTACT,
}: PageHeaderAvatarRecordProps) {
  return (
    <header className="px-6 py-6" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-start gap-5">
        <Avatar className="size-16 ring-2" style={{ ['--tw-ring-color' as string]: 'var(--primary-soft)' }}>
          <AvatarFallback
            style={{ background: 'var(--primary)', color: 'white' }}
            className="text-base"
          >
            {avatarInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="success" size="sm" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              {statusLabel}
            </Badge>
            <Badge variant="outline" size="sm" className="gap-1">
              <Star className="size-3" style={{ color: 'var(--warning)' }} />
              {favoriteLabel}
            </Badge>
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <a className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)]" href="#">
              <Mail className="size-3" />
              {contact.email}
            </a>
            <a className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)]" href="#">
              <Phone className="size-3" />
              {contact.phone}
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3" />
              {contact.location}
            </span>
            <span className="font-mono">{contact.recordId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button size="sm">New work order</Button>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
