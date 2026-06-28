'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ALL_TOOL_IDS, getTool, type ToolId } from '@/lib/tools';

export function ToolPicker({
  existing,
  onSelect,
  label = 'Add tool',
}: {
  existing: ToolId[];
  onSelect: (toolId: ToolId) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const available = ALL_TOOL_IDS.filter((toolId) => !existing.includes(toolId));

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-500 hover:text-zinc-200"
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60]"
            aria-label="Close tool picker"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-[61] mt-1 max-h-56 min-w-44 overflow-auto rounded-md border border-white/10 bg-[#111113] p-1 shadow-xl">
            {available.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-zinc-500">No more tools</div>
            ) : (
              available.map((toolId) => {
                const tool = getTool(toolId);
                const Icon = tool.icon;
                return (
                  <button
                    key={toolId}
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/8"
                    onClick={() => {
                      onSelect(toolId);
                      setOpen(false);
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{tool.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}