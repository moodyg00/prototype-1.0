'use client';

import React from 'react';

import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';

export default function PhonePage() {
  return (
    <div className="space-y-6 admin-stagger">
      <AdminPageHeader
        eyebrow="Communications"
        title="Phone"
        description="Call activity, inbound follow-up, and phone workflow references will live here."
      />

      <div className="admin-surface space-y-4 p-5">
        <div>
          <h2 className="text-sm font-medium">Phone workspace placeholder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This keeps the new navigation target live while the actual phone workflow is defined.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Use this section later for recent calls, missed-call triage, callback queues, and lead call outcomes.
        </p>
        <p className="border-t border-border/35 pt-4 text-sm text-muted-foreground">Placeholder only for now.</p>
      </div>
    </div>
  );
}