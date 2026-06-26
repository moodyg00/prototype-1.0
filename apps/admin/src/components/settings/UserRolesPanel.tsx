'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AVAILABILITY_SUBJECT_KINDS, type AvailabilitySubjectKind } from '@/src/lib/validation/scheduling';
import type { RolePermissions } from '@/src/lib/validation/user-roles';

type UserRoleRow = {
  id: string;
  name: string;
  permissions: RolePermissions;
  isSystem: boolean;
  userCount: number;
};

const LAYER_LABELS: Record<AvailabilitySubjectKind, string> = {
  owner: 'Owners',
  contractor: 'Contractors',
  business: 'Business',
  service: 'Services',
};

function defaultPermissions(): RolePermissions {
  return {
    availability: { layers: [], scope: 'own' },
    settings: { read: false, write: false },
  };
}

export function UserRolesPanel(): React.ReactElement {
  const [roles, setRoles] = React.useState<UserRoleRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draftName, setDraftName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editPermissions, setEditPermissions] = React.useState<RolePermissions>(defaultPermissions());

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/user-roles');
      const body = (await res.json()) as { roles?: UserRoleRow[] };
      setRoles(body.roles ?? []);
    } catch {
      toast.error('Could not load user roles.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addRole = async () => {
    const name = draftName.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/admin/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, permissions: defaultPermissions() }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Create failed.');
      setDraftName('');
      toast.success('Role created.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create role.');
    }
  };

  const startEdit = (role: UserRoleRow) => {
    setEditingId(role.id);
    setEditName(role.name);
    setEditPermissions(role.permissions ?? defaultPermissions());
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/admin/user-roles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), permissions: editPermissions }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Update failed.');
      setEditingId(null);
      toast.success('Role updated.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update role.');
    }
  };

  const deleteRole = async (role: UserRoleRow) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/user-roles/${role.id}`, { method: 'DELETE' });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? 'Delete failed.');
      toast.success('Role deleted.');
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete role.');
    }
  };

  const toggleLayer = (layer: AvailabilitySubjectKind) => {
    setEditPermissions((prev) => {
      const layers = prev.availability.layers.includes(layer)
        ? prev.availability.layers.filter((l) => l !== layer)
        : [...prev.availability.layers, layer];
      return { ...prev, availability: { ...prev.availability, layers } };
    });
  };

  const toggleSettings = (field: 'read' | 'write', checked: boolean) => {
    setEditPermissions((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: checked,
        ...(field === 'write' && checked ? { read: true } : {}),
      },
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">User roles</h3>
        <p className="text-xs text-muted-foreground">
          Roles control permissions across the app. Renaming a role updates it for every user assigned to it.
          Roles with active users cannot be deleted until those users are reassigned.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="New role name"
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => void addRole()}>
          <Plus className="h-4 w-4" />
          Add role
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading roles…</p>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border)' }}
            >
              {editingId === role.id ? (
                <div className="space-y-4">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Availability layers
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {AVAILABILITY_SUBJECT_KINDS.map((layer) => (
                        <label key={layer} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={editPermissions.availability.layers.includes(layer)}
                            onCheckedChange={() => toggleLayer(layer)}
                          />
                          {LAYER_LABELS[layer]}
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editPermissions.availability.scope === 'all'}
                        onCheckedChange={(checked) =>
                          setEditPermissions((prev) => ({
                            ...prev,
                            availability: {
                              ...prev.availability,
                              scope: checked ? 'all' : 'own',
                            },
                          }))
                        }
                      />
                      Can manage all subjects (not just own schedule)
                    </label>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Settings access
                    </p>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editPermissions.settings.read}
                        onCheckedChange={(checked) => toggleSettings('read', checked === true)}
                      />
                      Can view settings
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editPermissions.settings.write}
                        onCheckedChange={(checked) => toggleSettings('write', checked === true)}
                      />
                      Can edit settings
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void saveEdit()}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.isSystem ? <Badge variant="outline">System</Badge> : null}
                      <Badge variant="secondary">{role.userCount} users</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Availability:{' '}
                      {role.permissions?.availability?.layers?.length
                        ? role.permissions.availability.layers.map((l) => LAYER_LABELS[l]).join(', ')
                        : 'None'}
                      {' · '}
                      {role.permissions?.availability?.scope === 'all' ? 'All subjects' : 'Own only'}
                      {' · '}
                      Settings:{' '}
                      {role.permissions?.settings?.write
                        ? 'Read & write'
                        : role.permissions?.settings?.read
                          ? 'Read only'
                          : 'None'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(role)}>
                      Edit
                    </Button>
                    {!role.isSystem ? (
                      <Button size="sm" variant="outline" onClick={() => void deleteRole(role)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
