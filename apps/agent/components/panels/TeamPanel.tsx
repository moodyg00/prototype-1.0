"use client";

import React from 'react';
import { Users } from 'lucide-react';

type OrgNodeType = 'executive' | 'vp' | 'manager' | 'supervisor' | 'worker' | 'tool' | 'automation';

type OrgNode = {
  id: string;
  role: string;
  title: string;
  type: OrgNodeType;
  team?: string;
  model?: string;
};

type TeamDraft = {
  nodes: OrgNode[];
};

const defaultTeam: TeamDraft = {
  nodes: [
    { id: 'ceo', role: 'CEO', title: 'Chief Executive Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'cfo', role: 'CFO', title: 'Chief Financial Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'cto', role: 'CTO', title: 'Chief Technology Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'clo', role: 'CLO', title: 'Chief Legal Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'coo', role: 'COO', title: 'Chief Operating Officer', type: 'executive', model: 'grok-4.3' },
    { id: 'vp-finance', role: 'VP Finance', title: 'Finance Strategy and Controls', type: 'vp', team: 'Finance Ops' },
    { id: 'vp-engineering', role: 'VP Engineering', title: 'Platform and Product Delivery', type: 'vp', team: 'Technology' },
    { id: 'vp-legal', role: 'VP Legal', title: 'Corporate Governance and Policy', type: 'vp', team: 'Legal' },
    { id: 'ops-supervisor', role: 'Ops Supervisor', title: 'Daily Operations Supervisor', type: 'supervisor', team: 'Operations' },
  ],
};

export function TeamPanel() {
  const executives = defaultTeam.nodes.filter(n => n.type === 'executive');
  const leadership = defaultTeam.nodes.filter(n => n.type === 'vp' || n.type === 'manager' || n.type === 'supervisor');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
            <Users size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">Team Meeting</div>
            <div className="text-[10px] text-zinc-500 truncate">Executive and leadership room</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Executive Room</div>
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            {executives.map(exec => (
              <div key={exec.id} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{exec.role}</div>
                <div className="text-sm text-zinc-100 mt-1">{exec.title}</div>
                <div className="text-[10px] text-zinc-500 mt-2">{exec.model || 'grok'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">VP / Management Layer</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {leadership.map(node => (
              <div key={node.id} className="rounded-lg border border-white/10 p-3 bg-zinc-950/70">
                <div className="text-xs text-zinc-100">{node.role}</div>
                <div className="text-[11px] text-zinc-500 mt-1">{node.title}</div>
                <div className="text-[10px] text-zinc-600 mt-2">{node.team || node.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
