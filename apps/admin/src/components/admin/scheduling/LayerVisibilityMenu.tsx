'use client';

import * as React from 'react';
import { Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Menu, MenuCheckboxItem, MenuGroupLabel, MenuPopup, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { LAYER_META } from '@/src/lib/scheduling/events';
import { AVAILABILITY_LAYER_KEYS, type AvailabilityLayerKey } from '@/src/lib/validation/scheduling';

export type LayerVisibility = Record<AvailabilityLayerKey, boolean>;

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  contractor: true,
  contact: true,
  owner: true,
  business: true,
  service: true,
};

export function LayerVisibilityMenu({
  visibility,
  onChange,
}: {
  visibility: LayerVisibility;
  onChange: (next: LayerVisibility) => void;
}): React.ReactElement {
  const activeCount = AVAILABILITY_LAYER_KEYS.filter((key) => visibility[key]).length;

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4" />
            Layers
            <span className="ms-1 rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
              {activeCount}
            </span>
          </Button>
        }
      />
      <MenuPopup align="end" className="min-w-56">
        <MenuGroupLabel>Availability layers</MenuGroupLabel>
        <MenuSeparator />
        {AVAILABILITY_LAYER_KEYS.map((key) => (
          <MenuCheckboxItem
            key={key}
            checked={visibility[key]}
            closeOnClick={false}
            onCheckedChange={(checked) => onChange({ ...visibility, [key]: checked })}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: LAYER_META[key].color }}
              />
              {LAYER_META[key].label}
            </span>
          </MenuCheckboxItem>
        ))}
      </MenuPopup>
    </Menu>
  );
}
