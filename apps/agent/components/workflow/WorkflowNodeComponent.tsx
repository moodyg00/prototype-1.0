'use client';

import React from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { X } from 'lucide-react';
import type { WorkflowNodeData, HandleDef } from '../../lib/workflow/types';
import { getNodeIcon } from '../../lib/workflow/node-icons';

const HANDLE_COLORS: Record<string, string> = {
  any: '#94a3b8',
  string: '#6366f1',
  number: '#f59e0b',
  boolean: '#10b981',
  object: '#0ea5e9',
  array: '#8b5cf6',
  chat: '#ec4899',
  tool: '#d97706',
};

function NodeHandle({ handle, type, index, total }: { handle: HandleDef; type: 'source' | 'target'; index: number; total: number }) {
  const position = type === 'target' ? Position.Left : Position.Right;
  const offset = total === 1 ? 50 : 20 + (60 / (total - 1)) * index;

  return (
    <Handle
      type={type}
      position={position}
      id={handle.id}
      style={{
        top: `${offset}%`,
        width: 10,
        height: 10,
        background: HANDLE_COLORS[handle.dataType] ?? '#94a3b8',
        border: '2px solid rgba(0,0,0,0.4)',
      }}
      title={`${handle.label ?? handle.id} (${handle.dataType})`}
    />
  );
}

export function WorkflowNodeComponent({ id, data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const inputs = data.handles.filter(h => h.direction === 'input');
  const outputs = data.handles.filter(h => h.direction === 'output');
  const { deleteElements } = useReactFlow();

  const hasErrors = data.validationErrors && data.validationErrors.length > 0;
  const Icon = getNodeIcon(data.icon);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    void deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className={[
        'group/node rounded-lg border min-w-[168px] max-w-[220px] shadow-lg transition-all',
        selected
          ? 'border-white/40 shadow-white/10'
          : 'border-white/10 hover:border-white/20',
        hasErrors ? 'ring-1 ring-red-500/60' : '',
      ].join(' ')}
      style={{ background: `color-mix(in srgb, ${data.color} 15%, #18181b)` }}
    >
      {/* Header */}
      <div
        className="px-2.5 py-2 rounded-t-lg flex items-center gap-2"
        style={{ background: `color-mix(in srgb, ${data.color} 25%, transparent)` }}
      >
        <div
          className="w-5 h-5 rounded shrink-0 flex items-center justify-center ring-1 ring-inset ring-white/15"
          style={{ background: `color-mix(in srgb, ${data.color} 45%, #000)` }}
        >
          <Icon size={11} className="text-white" strokeWidth={2.25} />
        </div>
        <span className="text-xs font-semibold text-white truncate flex-1">{data.label}</span>
        {hasErrors && (
          <span className="text-red-400 text-xs shrink-0" title={data.validationErrors?.join('; ')}>!</span>
        )}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
          className="nodrag shrink-0 w-4 h-4 rounded flex items-center justify-center text-white/50 opacity-0 group-hover/node:opacity-100 focus-visible:opacity-100 hover:bg-black/30 hover:text-red-300 transition-all"
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        {inputs.length > 0 && (
          <div className="flex flex-col gap-1 mb-1">
            {inputs.map(h => (
              <div key={h.id} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: HANDLE_COLORS[h.dataType] }} />
                <span className="text-[10px] text-zinc-400">{h.label ?? h.id}</span>
              </div>
            ))}
          </div>
        )}
        {outputs.length > 0 && (
          <div className="flex flex-col gap-1 items-end">
            {outputs.map(h => (
              <div key={h.id} className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-400">{h.label ?? h.id}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: HANDLE_COLORS[h.dataType] }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handles */}
      {inputs.map((h, i) => (
        <NodeHandle key={h.id} handle={h} type="target" index={i} total={inputs.length} />
      ))}
      {outputs.map((h, i) => (
        <NodeHandle key={h.id} handle={h} type="source" index={i} total={outputs.length} />
      ))}
    </div>
  );
}
