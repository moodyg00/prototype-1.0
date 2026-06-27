'use client';

import {
  Bold,
  Italic,
  Underline,
  Pin,
  Star,
  Bell,
  BellOff,
} from 'lucide-react';
import * as React from 'react';
import { Toggle } from '@/components/ui/toggle';

// @mock-start
// @mock-end

export interface ButtonToggleStatefulProps {}

export function ButtonToggleStateful(_props: ButtonToggleStatefulProps = {}) {
  const [pinned, setPinned] = React.useState(true);
  const [starred, setStarred] = React.useState(false);
  const [muted, setMuted] = React.useState(false);

  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Format toggles (default variant)
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle defaultPressed aria-label="Bold">
            <Bold />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic />
          </Toggle>
          <Toggle aria-label="Underline">
            <Underline />
          </Toggle>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Outline variant — controlled
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            variant="outline"
            pressed={pinned}
            onPressedChange={setPinned}
            aria-label="Pin"
          >
            <Pin />
            <span>{pinned ? 'Pinned' : 'Pin'}</span>
          </Toggle>
          <Toggle
            variant="outline"
            pressed={starred}
            onPressedChange={setStarred}
            aria-label="Star"
          >
            <Star
              style={
                starred
                  ? { fill: 'var(--primary)', color: 'var(--primary)' }
                  : undefined
              }
            />
            <span>{starred ? 'Starred' : 'Star'}</span>
          </Toggle>
          <Toggle
            variant="outline"
            pressed={muted}
            onPressedChange={setMuted}
            aria-label="Mute notifications"
          >
            {muted ? <BellOff /> : <Bell />}
            <span>{muted ? 'Muted' : 'Notifications on'}</span>
          </Toggle>
        </div>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Sizes
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle defaultPressed variant="outline" size="sm" aria-label="Small">
            <Bold />
            sm
          </Toggle>
          <Toggle defaultPressed variant="outline" aria-label="Default">
            <Bold />
            default
          </Toggle>
          <Toggle defaultPressed variant="outline" size="lg" aria-label="Large">
            <Bold />
            lg
          </Toggle>
        </div>
      </div>
    </div>
  );
}
