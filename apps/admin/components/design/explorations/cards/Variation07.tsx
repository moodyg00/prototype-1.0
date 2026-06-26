import { MoreHorizontal, Edit3, Copy, Trash2, Share2 } from 'lucide-react';
import {
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameFooter,
  CardFrameHeader,
  CardFrameTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from '@/components/ui/menu';

// @mock-start
// @mock-end

export interface CardFramedActionMenuProps {}

export function CardFramedActionMenu(_props: CardFramedActionMenuProps = {}) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>Operations playbook v3</CardFrameTitle>
          <CardFrameDescription>
            Updated last Tuesday · 14 sections · used by 3 teams
          </CardFrameDescription>
          <CardFrameAction>
            <Menu>
              <MenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}
              >
                <MoreHorizontal className="size-3.5" />
              </MenuTrigger>
              <MenuPopup align="end" className="w-44">
                <MenuItem>
                  <Edit3 /> Edit
                </MenuItem>
                <MenuItem>
                  <Copy /> Duplicate
                </MenuItem>
                <MenuItem>
                  <Share2 /> Share
                </MenuItem>
                <MenuSeparator />
                <MenuItem variant="destructive">
                  <Trash2 /> Delete
                </MenuItem>
              </MenuPopup>
            </Menu>
          </CardFrameAction>
        </CardFrameHeader>
        <div className="px-6 pb-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <p className="leading-relaxed">
            Step-by-step procedures for dispatch, field service, and back-office reconciliation. The
            framed card pattern visually separates the structured shell from the body content.
          </p>
        </div>
        <CardFrameFooter>
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm">Ops</Badge>
            <Badge variant="outline" size="sm">Dispatch</Badge>
            <Badge variant="outline" size="sm">Field</Badge>
          </div>
        </CardFrameFooter>
      </CardFrame>

      <CardFrame>
        <CardFrameHeader>
          <CardFrameTitle>API key · proto-2-prod</CardFrameTitle>
          <CardFrameDescription>
            Rotated 2 days ago · last used 14 minutes ago
          </CardFrameDescription>
          <CardFrameAction>
            <Menu>
              <MenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}
              >
                <MoreHorizontal className="size-3.5" />
              </MenuTrigger>
              <MenuPopup align="end" className="w-44">
                <MenuItem>
                  <Copy /> Copy
                </MenuItem>
                <MenuSeparator />
                <MenuItem variant="destructive">
                  <Trash2 /> Revoke
                </MenuItem>
              </MenuPopup>
            </Menu>
          </CardFrameAction>
        </CardFrameHeader>
        <div className="px-6 pb-2">
          <code
            className="block truncate rounded-md border px-3 py-2 font-mono text-xs"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
          >
            sk_live_4d2c · · · · · · · · · · · · · 9f1a
          </code>
        </div>
        <CardFrameFooter>
          <Badge variant="success" size="sm" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-current" /> Active
          </Badge>
        </CardFrameFooter>
      </CardFrame>
    </div>
  );
}
