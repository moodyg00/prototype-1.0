'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ApiIntegrationCardRows,
  type ApiIntegrationRow,
} from '@/src/components/admin/integrations/ApiIntegrationCardRows';
import {
  ApiIntegrationFormDialog,
  type ApiIntegrationDto,
} from '@/src/components/admin/integrations/ApiIntegrationFormDialog';

export default function ApiIntegrationsPage() {
  const [rows, setRows] = React.useState<ApiIntegrationRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ApiIntegrationDto | null>(null);

  const loadIntegrations = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations');
      const body = (await res.json()) as { integrations?: ApiIntegrationRow[] };
      setRows(body.integrations ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = async (row: ApiIntegrationRow) => {
    try {
      const res = await fetch(`/api/admin/integrations/${row.id}`);
      const body = (await res.json()) as { integration?: ApiIntegrationDto };
      if (!res.ok || !body.integration) throw new Error('Could not load integration.');
      setEditing(body.integration);
      setDialogOpen(true);
    } catch {
      setEditing({
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        provider: row.provider,
        environment: row.environment,
        baseUrl: row.baseUrl,
        authType: row.authType,
        apiKey: '',
        apiSecret: '',
        webhookSecret: '',
        publicKey: '',
        externalAccountId: null,
        docsUrl: null,
      });
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Programmatic service connections — base URLs, API keys, webhook secrets, and provider settings.
        </p>
      </div>

      <Card className="rounded-2xl border">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Connected APIs</h2>
              <p className="text-xs text-muted-foreground">
                Click a row to edit. Mercury, Stripe, OpenAI, and other feeds belong here.
              </p>
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add integration
            </Button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading integrations…</div>
          ) : (
            <ApiIntegrationCardRows rows={rows} onEdit={(row) => void handleEdit(row)} />
          )}
        </CardContent>
      </Card>

      <ApiIntegrationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        integration={editing}
        onSaved={loadIntegrations}
      />
    </div>
  );
}
