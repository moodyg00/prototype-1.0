'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CredentialCardRows,
  type CredentialRow,
} from '@/src/components/admin/integrations/CredentialCardRows';
import {
  CredentialFormDialog,
  type CredentialDto,
} from '@/src/components/admin/integrations/CredentialFormDialog';

export default function CredentialsPage() {
  const [rows, setRows] = React.useState<CredentialRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CredentialDto | null>(null);

  const loadCredentials = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/credentials');
      const body = (await res.json()) as { credentials?: CredentialRow[] };
      setRows(body.credentials ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCredentials();
  }, [loadCredentials]);

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = async (row: CredentialRow) => {
    try {
      const res = await fetch(`/api/admin/credentials/${row.id}`);
      const body = (await res.json()) as { credential?: CredentialDto };
      if (!res.ok || !body.credential) throw new Error('Could not load credential.');
      setEditing(body.credential);
      setDialogOpen(true);
    } catch {
      setEditing({
        id: row.id,
        name: row.name,
        siteUrl: row.siteUrl,
        username: row.username,
        password: '',
        notes: null,
        isActive: row.isActive,
      });
      setDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credentials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Website logins for dashboards and vendor portals — username or email plus password.
        </p>
      </div>

      <Card className="rounded-2xl border">
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Saved logins</h2>
              <p className="text-xs text-muted-foreground">
                Click a row to edit. Passwords are masked in the list.
              </p>
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Add login
            </Button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading credentials…</div>
          ) : (
            <CredentialCardRows rows={rows} onEdit={(row) => void handleEdit(row)} />
          )}
        </CardContent>
      </Card>

      <CredentialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        credential={editing}
        onSaved={loadCredentials}
      />
    </div>
  );
}
