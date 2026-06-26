'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export default function PhonePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Phone</h1>
        <p className="max-w-3xl text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Call activity, inbound follow-up, and phone workflow references will live here.
        </p>
      </header>

      <Card className="rounded-3xl border shadow-xs/10">
        <CardHeader>
          <CardTitle>Phone workspace placeholder</CardTitle>
          <CardDescription>
            This keeps the new navigation target live while the actual phone workflow is defined.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <p>Use this section later for recent calls, missed-call triage, callback queues, and lead call outcomes.</p>
          <div className="rounded-2xl border px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
            Placeholder only for now.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}