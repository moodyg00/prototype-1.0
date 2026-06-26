'use client';

import React, { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData, NodePropertyField } from '../../lib/workflow/types';
import { CATALOG_BY_TYPE } from '../../lib/workflow/node-catalog';
import { X } from 'lucide-react';

interface NodeInspectorProps {
  node: Node<WorkflowNodeData>;
  onUpdate: (nodeId: string, properties: Record<string, unknown>, label?: string) => void;
  onClose: () => void;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: NodePropertyField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const strVal = value !== undefined && value !== null ? String(value) : '';

  switch (field.type) {
    case 'textarea':
    case 'code':
      return (
        <textarea
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.type === 'code' ? 5 : 3}
          className={[
            'w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25 resize-none',
            field.type === 'code' ? 'font-mono text-[11px]' : '',
          ].join(' ')}
        />
      );

    case 'select':
      return (
        <select
          value={strVal}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25"
        >
          {field.options?.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          type="number"
          value={strVal}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={field.placeholder}
          className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25"
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="accent-indigo-500 w-3 h-3"
          />
          <span className="text-xs text-zinc-400">{field.label}</span>
        </label>
      );

    case 'json':
      return (
        <textarea
          value={strVal}
          onChange={e => onChange(e.target.value)}
          rows={3}
          className="w-full bg-zinc-900 border border-white/10 rounded text-[11px] font-mono text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25 resize-none"
          placeholder="{}"
        />
      );

    default:
      return (
        <input
          type="text"
          value={strVal}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25"
        />
      );
  }
}

export function NodeInspector({ node, onUpdate, onClose }: NodeInspectorProps) {
  const typeDef = CATALOG_BY_TYPE[node.data.typeId];

  const handlePropertyChange = useCallback(
    (key: string, value: unknown) => {
      onUpdate(node.id, { ...node.data.properties, [key]: value });
    },
    [node, onUpdate],
  );

  const handleLabelChange = useCallback(
    (label: string) => {
      onUpdate(node.id, node.data.properties, label);
    },
    [node, onUpdate],
  );

  // Group fields by their group key
  const groups: Record<string, NodePropertyField[]> = {};
  for (const field of typeDef?.properties ?? []) {
    const g = field.group ?? 'General';
    if (!groups[g]) groups[g] = [];
    groups[g].push(field);
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950/60 border-l border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: node.data.color }}
          />
          <span className="text-xs font-semibold text-zinc-200 truncate">{node.data.label}</span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors ml-2"
        >
          <X size={13} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Node label */}
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">Label</label>
          <input
            type="text"
            value={node.data.label}
            onChange={e => handleLabelChange(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded text-xs text-zinc-200 px-2 py-1.5 outline-none focus:border-white/25"
          />
        </div>

        {/* Node type */}
        <div>
          <label className="block text-[10px] font-medium text-zinc-500 mb-1 uppercase tracking-wider">Type</label>
          <div className="text-[11px] font-mono text-zinc-500 px-2 py-1.5 bg-zinc-900/60 rounded border border-white/5">{node.data.typeId}</div>
        </div>

        {/* Validation errors */}
        {node.data.validationErrors && node.data.validationErrors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 space-y-1">
            {node.data.validationErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-red-400">{err}</p>
            ))}
          </div>
        )}

        {/* Property groups */}
        {Object.entries(groups).map(([groupName, fields]) => (
          <div key={groupName}>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
              {groupName}
            </div>
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.key}>
                  {field.type !== 'boolean' && (
                    <label className="flex items-center gap-1 text-[11px] text-zinc-400 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-400">*</span>}
                    </label>
                  )}
                  <FieldInput
                    field={field}
                    value={node.data.properties[field.key]}
                    onChange={val => handlePropertyChange(field.key, val)}
                  />
                  {field.description && (
                    <p className="text-[10px] text-zinc-600 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Handles info */}
        {node.data.handles.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 pb-1 border-b border-white/5">
              Handles
            </div>
            <div className="space-y-1">
              {node.data.handles.map(h => (
                <div key={h.id} className="flex items-center gap-2 text-[11px]">
                  <span className={h.direction === 'input' ? 'text-zinc-500' : 'text-zinc-400'}>
                    {h.direction === 'input' ? '→' : '←'}
                  </span>
                  <span className="text-zinc-400">{h.label ?? h.id}</span>
                  <span className="text-zinc-600 font-mono">{h.dataType}</span>
                  {h.required && <span className="text-red-400 text-[10px]">required</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
