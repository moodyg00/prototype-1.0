import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  ListFilter,
  ArrowUpDown,
  ChevronDown,
  Download,
} from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';

// @mock-start
const MOCK_TITLE = 'Catalog';
const MOCK_COUNT_LABEL = '482 items';
const MOCK_DESCRIPTION = 'Search, filter, and manage every service and product offered by your team.';
const MOCK_SEARCH_PLACEHOLDER = 'Search by name, SKU, or tag…';
const MOCK_SORT_LABEL = 'Sort: Recent';
// @mock-end

export interface PageHeaderSearchLedProps {
  title?: string;
  countLabel?: string;
  description?: string;
  searchPlaceholder?: string;
  sortLabel?: string;
}

export function PageHeaderSearchLed({
  title = MOCK_TITLE,
  countLabel = MOCK_COUNT_LABEL,
  description = MOCK_DESCRIPTION,
  searchPlaceholder = MOCK_SEARCH_PLACEHOLDER,
  sortLabel = MOCK_SORT_LABEL,
}: PageHeaderSearchLedProps) {
  return (
    <header
      className="flex flex-col gap-3 px-6 pt-5 pb-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <Badge variant="secondary" size="sm">
              {countLabel}
            </Badge>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New item
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-sm">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder={searchPlaceholder} />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Separator orientation="vertical" className="h-7" />

        <Button variant="outline" size="sm" className="gap-1.5">
          <ListFilter className="size-3.5" />
          Filter
          <ChevronDown className="size-3 opacity-60" />
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowUpDown className="size-3.5" />
          {sortLabel}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </div>
    </header>
  );
}
