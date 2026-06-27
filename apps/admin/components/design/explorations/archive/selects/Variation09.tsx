'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';

type Country = { value: string; label: string };
type CountryMap = Record<string, { label: string; cities: Country[] }>;

// @mock-start
const MOCK_COUNTRIES: CountryMap = {
  us: {
    label: 'United States',
    cities: [
      { value: 'sf', label: 'San Francisco' },
      { value: 'nyc', label: 'New York' },
      { value: 'chi', label: 'Chicago' },
      { value: 'la', label: 'Los Angeles' },
    ],
  },
  uk: {
    label: 'United Kingdom',
    cities: [
      { value: 'lon', label: 'London' },
      { value: 'man', label: 'Manchester' },
      { value: 'edi', label: 'Edinburgh' },
    ],
  },
  jp: {
    label: 'Japan',
    cities: [
      { value: 'tokyo', label: 'Tokyo' },
      { value: 'osaka', label: 'Osaka' },
      { value: 'kyoto', label: 'Kyoto' },
    ],
  },
  br: {
    label: 'Brazil',
    cities: [
      { value: 'sp', label: 'São Paulo' },
      { value: 'rio', label: 'Rio de Janeiro' },
    ],
  },
};
const MOCK_INITIAL_COUNTRY = 'us';
const MOCK_INITIAL_CITY = 'sf';
// @mock-end

export interface SelectCascadingTwoPaneProps {
  countries?: CountryMap;
  initialCountry?: string;
  initialCity?: string;
}

export function SelectCascadingTwoPane({
  countries = MOCK_COUNTRIES,
  initialCountry = MOCK_INITIAL_COUNTRY,
  initialCity = MOCK_INITIAL_CITY,
}: SelectCascadingTwoPaneProps = {}) {
  const [country, setCountry] = React.useState<string>(initialCountry);
  const [city, setCity] = React.useState<string>(initialCity);

  const cities = countries[country]?.cities ?? [];

  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <Field>
        <FieldLabel>Office location</FieldLabel>
        <div
          className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]"
        >
          <Select
            value={country}
            onValueChange={(v) => {
              const next = v as string;
              setCountry(next);
              const firstCity = countries[next]?.cities[0]?.value ?? '';
              setCity(firstCity);
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {(value) => countries[value as string]?.label ?? 'Country'}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {Object.entries(countries).map(([code, c]) => (
                <SelectItem key={code} value={code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          <ChevronRight
            className="hidden size-4 sm:block"
            style={{ color: 'var(--muted-foreground)' }}
          />

          <Select value={city} onValueChange={(v) => setCity(v as string)}>
            <SelectTrigger>
              <SelectValue>
                {(value) =>
                  cities.find((c) => c.value === value)?.label ?? 'City'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {cities.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <FieldDescription>
          Two-pane select — choosing a country resets the city to the first
          available option.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Static two-pane preview (vertically stacked)
        </div>
        <div
          className="grid overflow-hidden rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5 sm:grid-cols-2"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="border-b p-1 sm:border-b-0 sm:border-e"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="px-2 py-1.5 font-medium text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Country
            </div>
            {Object.entries(countries).map(([code, c]) => (
              <div
                key={code}
                className="flex items-center justify-between rounded-sm px-2 py-1 text-sm"
                style={{ background: code === country ? 'var(--muted)' : undefined }}
              >
                <span>{c.label}</span>
                {code === country && (
                  <ChevronRight
                    className="size-3.5"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="p-1">
            <div
              className="px-2 py-1.5 font-medium text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              City
            </div>
            {cities.map((c) => (
              <div
                key={c.value}
                className="rounded-sm px-2 py-1 text-sm"
                style={{ background: c.value === city ? 'var(--muted)' : undefined }}
              >
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
