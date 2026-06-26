'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

// @mock-start
const MOCK_INITIAL_QUERY = 'vertex';
const MOCK_INITIAL_LOADING_VALUE = 'Loading state';
// @mock-end

export interface InputSearchClearProps {
  initialQuery?: string;
  initialLoadingValue?: string;
}

export function InputSearchClear({
  initialQuery = MOCK_INITIAL_QUERY,
  initialLoadingValue = MOCK_INITIAL_LOADING_VALUE,
}: InputSearchClearProps = {}) {
  const [value, setValue] = React.useState(initialQuery);
  const [loadingValue, setLoadingValue] = React.useState(initialLoadingValue);

  return (
    <div className="grid gap-6 px-8 py-10 sm:grid-cols-2">
      <Field>
        <FieldLabel>Search with clear</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search contacts…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {value && (
            <InputGroupAddon align="inline-end">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                type="button"
                onClick={() => setValue('')}
              >
                <X />
              </Button>
            </InputGroupAddon>
          )}
        </InputGroup>
        <FieldDescription>
          Trailing X appears only when there&apos;s a value to clear.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Empty state (no clear button)</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput type="search" placeholder="Type to filter…" />
        </InputGroup>
        <FieldDescription>
          Same control, no value yet — chrome stays minimal.
        </FieldDescription>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel>Loading (results in flight)</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={loadingValue}
            onChange={(e) => setLoadingValue(e.target.value)}
            placeholder="Searching…"
          />
          <InputGroupAddon align="inline-end">
            <Spinner className="size-4" style={{ color: 'var(--muted-foreground)' }} />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel search"
              type="button"
              onClick={() => setLoadingValue('')}
            >
              <X />
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>
          Spinner sits beside the clear button while async results stream in.
        </FieldDescription>
      </Field>
    </div>
  );
}
