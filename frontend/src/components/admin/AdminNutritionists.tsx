import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { Nutritionist } from '@/types/api';
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
  Textarea,
  ConfirmDialog,
} from '@/components/ui';

const AdminNutritionists = () => {
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: '', email: '', specialization: '', bio: '' });
  const [confirmAction, setConfirmAction] = useState<{ item: Nutritionist; action: 'disable' | 'enable' | 'delete' } | null>(null);

  const fetchNutritionists = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; nutritionists: Nutritionist[] }>('/admin/nutritionists');
      setNutritionists(res.nutritionists);
    } catch {
      toast.error('Failed to load nutritionists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionists();
  }, []);

  const filtered = nutritionists.filter(n =>
    n.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    n.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!addForm.fullName || !addForm.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      const res = await api.post<{
        success: boolean;
        nutritionist: Nutritionist;
        tempPassword: string; // ← new field
      }>('/admin/nutritionists', {
        fullName: addForm.fullName,
        email: addForm.email,
        specialization: addForm.specialization,
        bio: addForm.bio,
        // ← password field removed entirely
      });

      setNutritionists(prev => [...prev, res.nutritionist]);
      setShowAdd(false);
      setAddForm({ fullName: '', email: '', specialization: '', bio: '' });

      // Show the temp password in a persistent toast the admin must dismiss manually
      toast.success(
        `${res.nutritionist.user.fullName} added. Temporary password: ${res.tempPassword}`,
        { duration: Infinity, dismissible: true }
      );
    } catch {
      toast.error('Failed to add nutritionist');
    }
  };

  const toggleStatus = async (item: Nutritionist) => {
    // ── Save snapshot before mutation ──────────────────────────
    const previousNutritionists = nutritionists;

    // ── Optimistic update ──────────────────────────────────────
    setNutritionists(prev =>
      prev.map(n =>
        n.id === item.id
          ? { ...n, user: { ...n.user, isActive: !n.user.isActive } }
          : n
      )
    );
    setConfirmAction(null);

    try {
      await api.put(`/admin/nutritionists/${item.id}/toggle`);
      toast.success(`Nutritionist ${!item.user.isActive ? 'activated' : 'deactivated'}`);
    } catch {
      // ── Rollback on failure ────────────────────────────────
      setNutritionists(previousNutritionists);
      toast.error('Status update failed — changes reverted');
    }
  };

  const deleteNutritionist = async (item: Nutritionist) => {
    // ── Save snapshot before mutation ──────────────────────────
    const previousNutritionists = nutritionists;

    // ── Optimistic update ──────────────────────────────────────
    setNutritionists(prev => prev.filter(n => n.id !== item.id));
    setConfirmAction(null);

    try {
      await api.delete(`/admin/nutritionists/${item.id}`);
      toast.success('Nutritionist deleted');
    } catch {
      // ── Rollback on failure ────────────────────────────────
      setNutritionists(previousNutritionists);
      toast.error('Delete failed — changes reverted');
    }
  };

  if (loading) {
    return (
      <div className="page-enter space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-10 w-full sm:w-72" />
            <Skeleton className="h-10 w-full sm:w-36" />
          </div>
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
        <h2 className="text-lg font-semibold tracking-tight">Manage Nutritionists</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search nutritionists..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
          <Button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto bg-kl-orange hover:bg-kl-orange/90 text-white"
          >
            Add Nutritionist
          </Button>
        </div>
      </div>

      {/* Table — hidden on mobile */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nutritionist</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kl-orange-20 text-kl-orange font-medium text-sm">
                          {n.user.fullName[0]}
                        </div>
                        <span className="font-medium">{n.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{n.user.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{n.specialization || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          n.user.isActive
                            ? 'bg-kl-green-light text-kl-green-dark border-0'
                            : 'bg-kl-gray-bg text-kl-gray-30 border-0'
                        }
                      >
                        {n.user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(n.user.createdAt).toLocaleDateString()}
                    </TableCell>
                    {/* ✅ Actions cell – was missing */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={
                            n.user.isActive
                              ? 'text-kl-error hover:text-kl-error hover:bg-kl-error/10'
                              : 'text-kl-green hover:text-kl-green hover:bg-kl-green-light'
                          }
                          onClick={() => setConfirmAction({ item: n, action: n.user.isActive ? 'disable' : 'enable' })}
                        >
                          {n.user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({ item: n, action: 'delete' })}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No nutritionists found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cards — shown only on mobile */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No nutritionists found.
            </CardContent>
          </Card>
        ) : (
          filtered.map(n => (
            <Card key={n.id}>
              <CardContent className="p-4">
                {/* Header row — avatar + name + badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kl-orange-20 text-kl-orange font-medium text-sm">
                      {n.user.fullName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{n.user.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.user.email}</p>
                    </div>
                  </div>
                  <Badge
                    className={
                      n.user.isActive
                        ? 'bg-kl-green-light text-kl-green-dark border-0'
                        : 'bg-kl-gray-bg text-kl-gray-30 border-0'
                    }
                  >
                    {n.user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1 text-sm text-kl-text-m">
                  <div className="flex justify-between">
                    <span>Specialization</span>
                    <span className="text-kl-text-dark font-medium">
                      {n.specialization || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joined</span>
                    <span className="text-kl-text-dark font-medium">
                      {new Date(n.user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className={`flex-1 ${n.user.isActive
                      ? 'bg-kl-error-light text-kl-error hover:bg-kl-error hover:text-white'
                      : 'bg-kl-green-light text-kl-green-dark hover:bg-kl-green hover:text-white'
                      }`}
                    onClick={() => setConfirmAction({ item: n, action: n.user.isActive ? 'disable' : 'enable' })}
                  >
                    {n.user.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setConfirmAction({ item: n, action: 'delete' })}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Nutritionist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={addForm.fullName}
                onChange={e => setAddForm(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={addForm.email}
                onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Specialization</label>
              <Input
                placeholder="e.g., Clinical Nutrition, Sports Nutrition"
                value={addForm.specialization}
                onChange={e => setAddForm(p => ({ ...p, specialization: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                rows={3}
                value={addForm.bio}
                onChange={e => setAddForm(p => ({ ...p, bio: e.target.value }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A secure temporary password will be generated and shown to you once after creation.
              The nutritionist must change it on first login.
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Nutritionist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.action === 'delete' ? 'Delete Nutritionist' :
            confirmAction?.action === 'enable' ? 'Enable Nutritionist' : 'Disable Nutritionist'
        }
        description={`Are you sure you want to ${confirmAction?.action} ${confirmAction?.item.user.fullName}?`}
        confirmLabel={
          confirmAction?.action === 'delete' ? 'Delete' :
            confirmAction?.action === 'enable' ? 'Enable' : 'Disable'
        }
        variant={confirmAction?.action === 'delete' ? 'destructive' : 'default'}
        onConfirm={() => {
          if (!confirmAction) return;
          if (confirmAction.action === 'delete') deleteNutritionist(confirmAction.item);
          else toggleStatus(confirmAction.item);
        }}
      />
    </div>
  );
};

export default AdminNutritionists;