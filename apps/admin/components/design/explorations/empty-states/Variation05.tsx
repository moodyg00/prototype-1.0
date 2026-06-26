import { SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ActiveFilter = { label: string };

// @mock-start
const MOCK_QUERY = 'rooftop';
const MOCK_SEARCHED_COUNT = '12,408';
const MOCK_ACTIVE_FILTERS: ActiveFilter[] = [
  { label: 'Status: Closed' },
  { label: 'Owner: Aiden' },
  { label: 'City: Boulder' },
];
// @mock-end

export interface EmptyStateSearchNoResultsProps {
  query?: string;
  searchedCount?: string;
  activeFilters?: ReadonlyArray<ActiveFilter>;
}

export function EmptyStateSearchNoResults({
  query = MOCK_QUERY,
  searchedCount = MOCK_SEARCHED_COUNT,
  activeFilters = MOCK_ACTIVE_FILTERS,
}: EmptyStateSearchNoResultsProps = {}) {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div
          className="grid size-12 place-items-center rounded-xl border"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <SearchX className="size-5" />
        </div>
        <h3 className="mt-5 font-heading font-semibold text-xl">No results for &ldquo;{query}&rdquo;</h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          We searched {searchedCount} work orders and couldn&apos;t find any matches. Try different keywords
          or clear one of the active filters below.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          {activeFilters.map((f) => (
            <Badge
              key={f.label}
              variant="outline"
              size="sm"
              className="gap-1.5 font-normal"
            >
              {f.label}
              <button type="button" aria-label="Remove filter">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="outline" size="sm">
            Clear all filters
          </Button>
          <Button variant="ghost" size="sm">
            Search again
          </Button>
        </div>
      </div>
    </div>
  );
}
