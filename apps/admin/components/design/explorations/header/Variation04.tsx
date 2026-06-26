'use client';

import {
  Search,
  ListFilter,
  ArrowUpDown,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

type FilterChip = {
  label: string;
  count: number;
};

// @mock-start
const MOCK_FILTER_CHIPS: FilterChip[] = [
  { label: 'Status: Open', count: 12 },
  { label: 'Owner: Me', count: 4 },
  { label: 'Priority: High', count: 3 },
  { label: 'Due: This week', count: 7 },
];
const MOCK_TITLE = 'Work Orders';
const MOCK_RECORD_COUNT = 127;
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderDenseUtilityProps {
  filterChips?: ReadonlyArray<FilterChip>;
  title?: string;
  recordCount?: number;
  userInitials?: string;
}

export function HeaderDenseUtility({
  filterChips = MOCK_FILTER_CHIPS,
  title = MOCK_TITLE,
  recordCount = MOCK_RECORD_COUNT,
  userInitials = MOCK_USER_INITIALS,
}: HeaderDenseUtilityProps) {
  return (
    <header
      className="flex w-full flex-col"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex h-11 items-center gap-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="grid size-6 place-items-center rounded font-semibold text-white text-[10px]"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <div className="font-semibold text-sm">{title}</div>
          <Badge variant="secondary" size="sm">
            {recordCount}
          </Badge>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToggleGroup defaultValue={['list']} variant="outline" size="sm" aria-label="View mode">
          <ToggleGroupItem value="list" aria-label="List view">
            <List />
          </ToggleGroupItem>
          <ToggleGroupItem value="board" aria-label="Board view">
            <LayoutGrid />
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" aria-label="Calendar view">
            <Calendar />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button variant="ghost" size="sm" className="gap-1.5">
          <ListFilter className="size-3.5" />
          Filter
        </Button>

        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowUpDown className="size-3.5" />
          Sort
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="w-56">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search records..." />
            </InputGroup>
          </div>

          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New
          </Button>

          <Avatar className="size-7">
            <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div
        className="flex h-9 items-center gap-1.5 overflow-x-auto px-4 text-xs"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
      >
        <span className="me-1 text-[11px] uppercase tracking-wider">Filters</span>
        {filterChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-[11px] transition-colors hover:bg-[var(--muted)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <span style={{ color: 'var(--foreground)' }}>{chip.label}</span>
            <span
              className="grid size-4 place-items-center rounded-full font-medium text-[9px]"
              style={{ background: 'var(--muted)' }}
            >
              {chip.count}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] transition-colors hover:bg-[var(--muted)]"
        >
          <Plus className="size-3" />
          Add filter
        </button>
      </div>
    </header>
  );
}
