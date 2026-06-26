'use client';

import React from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { WorkflowNodeData, HandleDef } from '../../lib/workflow/types';

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

export function WorkflowNodeComponent({ data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  const inputs = data.handles.filter(h => h.direction === 'input');
  const outputs = data.handles.filter(h => h.direction === 'output');

  const hasErrors = data.validationErrors && data.validationErrors.length > 0;

  return (
    <div
      className={[
        'rounded-lg border min-w-[160px] max-w-[220px] shadow-lg transition-all',
        selected
          ? 'border-white/40 shadow-white/10'
          : 'border-white/10 hover:border-white/20',
        hasErrors ? 'ring-1 ring-red-500/60' : '',
      ].join(' ')}
      style={{ background: `color-mix(in srgb, ${data.color} 15%, #18181b)` }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 rounded-t-lg flex items-center gap-2"
        style={{ background: `color-mix(in srgb, ${data.color} 25%, transparent)` }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: data.color }}
        />
        <span className="text-xs font-semibold text-white truncate flex-1">{data.label}</span>
        {hasErrors && (
          <span className="text-red-400 text-xs shrink-0">!</span>
        )}
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
