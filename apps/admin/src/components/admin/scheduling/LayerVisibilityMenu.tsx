'use client';

import * as React from 'react';
import { Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu';
import { LAYER_META } from '@/src/lib/scheduling/events';
import type { AvailabilitySubjectKind } from '@/src/lib/validation/scheduling';

export type AvailabilityFilterOption = {
  key: string;
  subjectKind: AvailabilitySubjectKind;
  entityId: string;
  label: string;
};

export type AvailabilityFilterVisibility = Record<string, boolean>;

export function buildAvailabilityFilterKey(
  subjectKind: AvailabilitySubjectKind,
  entityId: string,
): string {
  return `${subjectKind}:${entityId}`;
}

export function buildDefaultVisibility(options: AvailabilityFilterOption[]): AvailabilityFilterVisibility {
  return Object.fromEntries(options.map((option) => [option.key, true]));
}

export function LayerVisibilityMenu({
  options,
  visibility,
  onChange,
}: {
  options: AvailabilityFilterOption[];
  visibility: AvailabilityFilterVisibility;
  onChange: (next: AvailabilityFilterVisibility) => void;
}): React.ReactElement {
  const activeCount = options.filter((option) => visibility[option.key] !== false).length;

  const grouped = React.useMemo(() => {
    const map = new Map<AvailabilitySubjectKind, AvailabilityFilterOption[]>();
    for (const option of options) {
      const list = map.get(option.subjectKind) ?? [];
      list.push(option);
      map.set(option.subjectKind, list);
    }
    return map;
  }, [options]);

  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" />}>
        <Layers className="h-4 w-4" />
        Overlays
        <span className="ms-1 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
          {activeCount}
        </span>
      </MenuTrigger>
      <MenuPopup align="end" className="max-h-96 min-w-64 overflow-y-auto">
        {options.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">No availability overlays published yet.</div>
        ) : (
          Array.from(grouped.entries()).map(([subjectKind, items], index) => (
            <React.Fragment key={subjectKind}>
              {index > 0 ? <MenuSeparator /> : null}
              <MenuGroup>
                <MenuGroupLabel>{LAYER_META[subjectKind].label}</MenuGroupLabel>
                {items.map((option) => (
                  <MenuCheckboxItem
                    key={option.key}
                    checked={visibility[option.key] !== false}
                    onCheckedChange={(checked) =>
                      onChange({ ...visibility, [option.key]: Boolean(checked) })
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: LAYER_META[subjectKind].color }}
                      />
                      {option.label}
                    </span>
                  </MenuCheckboxItem>
                ))}
              </MenuGroup>
            </React.Fragment>
          ))
        )}
      </MenuPopup>
    </Menu>
  );
}

export function eventMatchesVisibility(
  event: {
    kind: string;
    layerKey?: AvailabilitySubjectKind;
    userId?: string | null;
    serviceId?: string | null;
    businessId?: string | null;
  },
  visibility: AvailabilityFilterVisibility,
): boolean {
  if (event.kind === 'booking') return true;
  if (!event.layerKey) return true;
  const entityId = event.userId ?? event.serviceId ?? event.businessId ?? '';
  if (!entityId) return visibility[event.layerKey] !== false;
  const key = buildAvailabilityFilterKey(event.layerKey, entityId);
  return visibility[key] !== false;
}
