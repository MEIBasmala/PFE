import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Patient } from '@/types/api';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Skeleton,
  ConfirmDialog,
} from '@/components/ui';

const AdminPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ patient: Patient; action: 'disable' | 'enable' | 'delete' } | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; patients: Patient[] }>('/admin/patients');
      setPatients(res.patients);
    } catch {
      toast.error('Failed to load Clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const toggleStatus = async (patient: Patient) => {
    // ── Save snapshot before mutation ──────────────────────────
    const previousPatients = patients;

    // ── Optimistic update ──────────────────────────────────────
    setPatients(prev =>
      prev.map(p =>
        p.id === patient.id
          ? { ...p, user: { ...p.user, isActive: !p.user.isActive } }
          : p
      )
    );
    setConfirmAction(null);

    try {
      await api.put(`/admin/patients/${patient.id}/toggle`);
      toast.success(`Client ${!patient.user.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      // ── Rollback on failure ────────────────────────────────
      setPatients(previousPatients);
      toast.error('Status update failed — changes reverted');
    }
  };

  const deletePatient = async (patient: Patient) => {
    // ── Save snapshot before mutation ──────────────────────────
    const previousPatients = patients;

    // ── Optimistic update ──────────────────────────────────────
    setPatients(prev => prev.filter(p => p.id !== patient.id));
    setConfirmAction(null);

    try {
      await api.delete(`/admin/patients/${patient.id}`);
      toast.success('Client deleted');
    } catch {
      // ── Rollback on failure ────────────────────────────────
      setPatients(previousPatients);
      toast.error('Delete failed — changes reverted');
    }
  };

  const filtered = patients.filter(p =>
    p.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-full sm:w-72" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header with responsive stacking */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Manage Clients</h2>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
      </div>

      {/* Table wrapper – ensures horizontal scroll on all screen sizes */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap font-medium">{p.user.fullName}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.user.email}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(p.user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.user.isActive
                            ? 'bg-secondary text-secondary-foreground border-0'
                            : 'bg-muted text-muted-foreground border-0'
                        }
                      >
                        {p.user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          className={
                            p.user.isActive
                              ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-accent'
                          }
                          onClick={() => setConfirmAction({ patient: p, action: p.user.isActive ? 'disable' : 'enable' })}
                        >
                          {p.user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setConfirmAction({ patient: p, action: 'delete' })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No Clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No clients found.
            </CardContent>
          </Card>
        ) : (
          filtered.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.user.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Joined {new Date(p.user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      p.user.isActive
                        ? 'bg-secondary text-secondary-foreground border-0 shrink-0'
                        : 'bg-muted text-muted-foreground border-0 shrink-0'
                    }
                  >
                    {p.user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className={`flex-1 ${p.user.isActive
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                      }`}
                    onClick={() => setConfirmAction({ patient: p, action: p.user.isActive ? 'disable' : 'enable' })}
                  >
                    {p.user.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmAction({ patient: p, action: 'delete' })}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Confirm Action Dialog – conditionally rendered */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.action === 'delete' ? 'Delete Client' :
            confirmAction?.action === 'enable' ? 'Enable Client' : 'Disable Client'
        }
        description={
          confirmAction?.action === 'delete'
            ? `Delete ${confirmAction.patient.user.fullName}? This cannot be undone.`
            : `${confirmAction?.action === 'enable' ? 'Enable' : 'Disable'} ${confirmAction?.patient.user.fullName}?`
        }
        confirmLabel={
          confirmAction?.action === 'delete' ? 'Delete' :
            confirmAction?.action === 'enable' ? 'Enable' : 'Disable'
        }
        variant={confirmAction?.action === 'delete' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.action === 'delete') deletePatient(confirmAction.patient);
          else toggleStatus(confirmAction.patient);
        }}
      />
    </div>
  );
};

export default AdminPatients;