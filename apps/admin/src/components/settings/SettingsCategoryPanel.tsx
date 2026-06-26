import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * SettingsCategoryPanel
 *
 * Renders the placeholder body for any non-theming settings category.
 * Mirrors Proto-1's `SettingResource` filter shape — each category groups
 * one or more `settings.module` values. Once the Prisma `Setting` model
 * lands, this becomes a real key/value editor.
 *
 * Proto-1 source: app/Filament/Resources/SettingResource.php
 *   - getCategoryOptions()
 *   - getCategoryModules()
 */
interface Props {
  title: string;
  description: string;
  modules: string[];
}

export function SettingsCategoryPanel({ title, description, modules }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      </div>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Backed by <code>settings</code> rows with module
          </span>
          {modules.map((m) => (
            <Badge key={m} variant="outline">{m}</Badge>
          ))}
        </div>

        <div className="rounded-lg p-4" style={{ background: 'var(--muted)' }}>
          <p className="text-sm">
            Key/value editor is ported in the next pass. The Proto-1 settings table is a generic
            <code className="mx-1">module + key → jsonb value</code>
            store. The Prisma <code>Setting</code> model is defined in <code>prisma/schema.prisma</code>;
            wiring this panel to it requires a server action plus a JSON validator per module.
          </p>
        </div>
      </Card>
    </div>
  );
}
