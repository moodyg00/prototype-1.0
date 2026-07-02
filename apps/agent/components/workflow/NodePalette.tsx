'use client';

import React, { useState } from 'react';
import { NODE_CATALOG, CATEGORY_ORDER, CATEGORY_LABELS } from '../../lib/workflow/node-catalog';
import { getNodeIcon } from '../../lib/workflow/node-icons';
import type { NodeTypeDefinition } from '../../lib/workflow/types';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

function NodeTypeCard({ def }: { def: NodeTypeDefinition }) {
  const Icon = getNodeIcon(def.icon);
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/workflow-node-type', def.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={def.description}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/[0.06] cursor-grab active:cursor-grabbing select-none group transition-colors"
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all"
        style={{ background: `color-mix(in srgb, ${def.color} 22%, #18181b)` }}
      >
        <Icon size={13} style={{ color: def.color }} strokeWidth={2} />
      </div>
      <span className="text-[12px] leading-tight text-zinc-300 group-hover:text-white transition-colors truncate">{def.label}</span>
    </div>
  );
}

export function NodePalette() {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = query.trim()
    ? NODE_CATALOG.filter(n =>
        n.label.toLowerCase().includes(query.toLowerCase()) ||
        n.description.toLowerCase().includes(query.toLowerCase()),
      )
    : null;

  const toggleCategory = (cat: string) => {
    setCollapsed(c => ({ ...c, [cat]: !c[cat] }));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-zinc-950/60 border-r border-white/5">
      {/* Search */}
      <div className="p-2 border-b border-white/5">
        <div className="relative">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-white/5 border border-white/10 rounded text-xs text-zinc-300 placeholder-zinc-600 pl-6 pr-2 py-1.5 outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-1 scrollbar-thin">
        {filtered ? (
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-[11px] text-zinc-600 px-2 py-4 text-center">No nodes match</p>
            )}
            {filtered.map(n => <NodeTypeCard key={n.type} def={n} />)}
          </div>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const nodes = NODE_CATALOG.filter(n => n.category === cat);
            if (!nodes.length) return null;
            const isCollapsed = !!collapsed[cat];
            return (
              <div key={cat} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
                >
                  {isCollapsed
                    ? <ChevronRight size={10} />
                    : <ChevronDown size={10} />}
                  {CATEGORY_LABELS[cat]}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {nodes.map(n => <NodeTypeCard key={n.type} def={n} />)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
