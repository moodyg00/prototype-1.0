'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, Send, MoreHorizontal, Copy, Trash2, Archive } from 'lucide-react';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';

// @mock-start
const MOCK_TITLE = 'Invoice INV-0042';
const MOCK_META = 'Vertex Labs · $4,820.00 · Due in 12 days';
const MOCK_SEND_OPTIONS: ReadonlyArray<string> = [
  'Send and copy link',
  'Schedule send…',
  'Send a test to me',
];
// @mock-end

export interface PageHeaderSplitActionsProps {
  title?: string;
  meta?: string;
  sendOptions?: ReadonlyArray<string>;
}

export function PageHeaderSplitActions({
  title = MOCK_TITLE,
  meta = MOCK_META,
  sendOptions = MOCK_SEND_OPTIONS,
}: PageHeaderSplitActionsProps) {
  return (
    <header
      className="flex flex-wrap items-end justify-between gap-3 px-6 py-5"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {meta}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Save draft
        </Button>

        <div className="inline-flex items-stretch rounded-lg">
          <Button size="sm" className="gap-1.5 rounded-e-none">
            <Send className="size-3.5" />
            Send invoice
          </Button>
          <Menu>
            <MenuTrigger
              render={
                <Button
                  size="sm"
                  className="rounded-s-none border-s-0 px-2"
                  aria-label="More send options"
                />
              }
            >
              <ChevronDown className="size-3.5" />
            </MenuTrigger>
            <MenuPopup align="end" className="min-w-44">
              {sendOptions.map((option) => (
                <MenuItem key={option}>{option}</MenuItem>
              ))}
            </MenuPopup>
          </Menu>
        </div>

        <Menu>
          <MenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="More actions" />
            }
          >
            <MoreHorizontal className="size-4" />
          </MenuTrigger>
          <MenuPopup align="end" className="min-w-44">
            <MenuItem>
              <Copy className="size-4" />
              Duplicate
            </MenuItem>
            <MenuItem>
              <Archive className="size-4" />
              Archive
            </MenuItem>
            <MenuItem variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    </header>
  );
}
