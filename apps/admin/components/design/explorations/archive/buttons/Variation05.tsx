'use client';

import {
  Save,
  ChevronDown,
  Download,
  CloudUpload,
  Send,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/group';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';

// @mock-start
// @mock-end

export interface ButtonSplitProps {}

export function ButtonSplit(_props: ButtonSplitProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Split — primary action + dropdown
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup>
            <Button>
              <Save />
              Save changes
            </Button>
            <Menu>
              <MenuTrigger
                render={
                  <Button aria-label="Save options" className="px-2">
                    <ChevronDown className="size-3.5" />
                  </Button>
                }
              />
              <MenuPopup align="end" className="w-56">
                <MenuItem>
                  <Save />
                  Save
                </MenuItem>
                <MenuItem>
                  <CloudUpload />
                  Save and publish
                </MenuItem>
                <MenuItem>
                  <Download />
                  Save as draft
                </MenuItem>
                <MenuSeparator />
                <MenuItem>
                  <History />
                  View revisions
                </MenuItem>
              </MenuPopup>
            </Menu>
          </ButtonGroup>

          <ButtonGroup>
            <Button variant="outline">
              <Send />
              Send for review
            </Button>
            <Menu>
              <MenuTrigger
                render={
                  <Button
                    variant="outline"
                    aria-label="Send options"
                    className="px-2"
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                }
              />
              <MenuPopup align="end" className="w-56">
                <MenuItem>Send to manager</MenuItem>
                <MenuItem>Send to client</MenuItem>
                <MenuSeparator />
                <MenuItem>Schedule send…</MenuItem>
              </MenuPopup>
            </Menu>
          </ButtonGroup>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Compact (sm)
        </div>
        <ButtonGroup>
          <Button size="sm" variant="outline">
            <Download />
            Export CSV
          </Button>
          <Menu>
            <MenuTrigger
              render={
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Export options"
                  className="px-1.5"
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              }
            />
            <MenuPopup align="end" className="w-44">
              <MenuItem>Export CSV</MenuItem>
              <MenuItem>Export JSON</MenuItem>
              <MenuItem>Export PDF</MenuItem>
            </MenuPopup>
          </Menu>
        </ButtonGroup>
      </div>
    </div>
  );
}
