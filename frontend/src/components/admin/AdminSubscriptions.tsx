import { useState, useEffect } from 'react';
import { api ,exportPaymentsCSV } from '@/services/api';
import type { Package, Payment, SubscriptionWithUser } from '@/types/api';
import { toast } from 'sonner';
import { TrendingUp, Clock, DollarSign, CreditCard, FileText, Receipt, Users } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
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
} from '@/components/ui';

type Filter = 'All' | 'Active' | 'Expired' | 'Cancelled';


const AdminSubscriptions = () => {
  const [subs, setSubs] = useState<SubscriptionWithUser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('All');
  const [viewSub, setViewSub] = useState<SubscriptionWithUser | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const subsRes = await api.get<{ success: boolean; subscriptions: SubscriptionWithUser[] }>('/admin/subscriptions');
      const paymentsRes = await api.get<{ success: boolean; payments: Payment[] }>('/admin/payments');
      setSubs(subsRes.subscriptions);
      setPayments(paymentsRes.payments);
    } catch {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = filter === 'All' ? subs : subs.filter(s => s.status === filter.toUpperCase());

  const handleExport = async () => {
  try {
    await exportPaymentsCSV();
    toast.success('Payment history downloaded');
  } catch {
    toast.error('Export failed');
  }
};

  const stats = {
    active: subs.filter(s => s.status === 'ACTIVE').length,
    expired: subs.filter(s => s.status === 'EXPIRED').length,
    revenue: subs.reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {(['All', 'Active', 'Expired', 'Cancelled'] as Filter[]).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Stats Cards – using same icon+card style as AdminHome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.active}</h3>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.expired}</h3>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">DZD {stats.revenue.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                          {s.user.fullName[0]}
                        </div>
                        <span className="font-medium">{s.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.package.name === 'Premium'
                            ? 'bg-primary/10 text-primary border-0 '
                            : 'bg-muted text-muted-foreground border-0 z-50'
                        }
                      >
                        {s.package.name}
                      </Badge>

                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(s.startDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(s.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">DZD {s.amount}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.status === 'ACTIVE'
                            ? 'bg-secondary text-secondary-foreground border-0'
                            : s.status === 'CANCELLED'
                              ? 'bg-destructive/10 text-destructive border-0'
                              : 'bg-muted text-muted-foreground border-0'
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setViewSub(s)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Payment History</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="w-full sm:w-auto text-primary hover:bg-primary/10"
          >
            Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(p => {
                  const sub = subs.find(s => s.id === p.subscriptionId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">{sub?.user.fullName || 'Unknown'}</TableCell>
                      <TableCell>{sub?.package.name || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap font-medium">DZD {p.amount}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            p.status === 'SUCCESS'
                              ? 'bg-secondary text-secondary-foreground border-0'
                              : p.status === 'FAILED'
                                ? 'bg-destructive/10 text-destructive border-0'
                                : 'bg-primary/10 text-primary border-0'
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payments recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Subscription Dialog (unchanged, but uses consistent styling) */}
      <Dialog open={!!viewSub} onOpenChange={() => setViewSub(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          {viewSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium">
                  {viewSub.user.fullName[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-lg">{viewSub.user.fullName}</h4>
                  <p className="text-sm text-muted-foreground">{viewSub.user.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-1 border-b border-border py-2 sm:flex-row sm:justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium">{viewSub.package.name}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border py-2 sm:flex-row sm:justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    className={
                      viewSub.status === 'ACTIVE'
                        ? 'bg-secondary text-secondary-foreground border-0 w-fit'
                        : 'bg-muted text-muted-foreground border-0 w-fit'
                    }
                  >
                    {viewSub.status}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1 border-b border-border py-2 sm:flex-row sm:justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm font-medium">{new Date(viewSub.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border py-2 sm:flex-row sm:justify-between">
                  <span className="text-sm text-muted-foreground">End Date</span>
                  <span className="text-sm font-medium">{new Date(viewSub.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold">DZD {viewSub.amount}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSub(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;