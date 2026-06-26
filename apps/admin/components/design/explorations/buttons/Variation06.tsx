'use client';

import {
  List,
  LayoutGrid,
  Calendar,
  Map,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// @mock-start
// @mock-end

export interface ButtonSegmentedProps {}

export function ButtonSegmented(_props: ButtonSegmentedProps = {}) {
  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Single-select segmented (outline)
        </div>
        <ToggleGroup
          defaultValue={['list']}
          variant="outline"
          aria-label="View mode"
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List />
            <span>List</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="board" aria-label="Board view">
            <LayoutGrid />
            <span>Board</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <Calendar />
            <span>Calendar</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="map" aria-label="Map view">
            <Map />
            <span>Map</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Icon-only segmented
        </div>
        <ToggleGroup
          defaultValue={['center']}
          variant="outline"
          aria-label="Alignment"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Multi-select (default variant)
        </div>
        <ToggleGroup
          defaultValue={['bold', 'italic']}
          multiple
          aria-label="Format"
        >
          <ToggleGroupItem value="bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic" className="italic">
            I
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" className="underline">
            U
          </ToggleGroupItem>
          <ToggleGroupItem value="strike" className="line-through">
            S
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-3">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Sizes
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup defaultValue={['list']} variant="outline" size="sm">
            <ToggleGroupItem value="list" aria-label="List">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar">
              <Calendar />
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup defaultValue={['board']} variant="outline">
            <ToggleGroupItem value="list" aria-label="List">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar">
              <Calendar />
            </ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup defaultValue={['calendar']} variant="outline" size="lg">
            <ToggleGroupItem value="list" aria-label="List">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" aria-label="Board">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar">
              <Calendar />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
