import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, TrendingUp, UserPlus } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  Button,
  Skeleton,
} from '@/components/ui';

// Lazy-load the heavy graph section so the stat cards appear instantly
const AdminDashboardGraphs = lazy(() => import('./AdminDashboardGraphs'));

interface DashboardStats {
  totalPatients: number;
  totalNutritionists: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { Icon: UserPlus, label: 'Add Nutritionist', path: '/admin/nutritionists' },
    { Icon: Mail, label: 'View Inquiries', path: '/admin/inquiries' },
  ];

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ success: boolean; stats: DashboardStats }>('/admin/statistics');
      setStats(data.stats);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="page-enter space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const totalUsers = stats.totalPatients + stats.totalNutritionists;

  const formatRevenue = (amount: number) => `DZD ${amount.toLocaleString()}`;

  const statItems = [
    { Icon: Users, value: totalUsers.toLocaleString(), label: 'Total Users' },
    { Icon: TrendingUp, value: formatRevenue(stats.totalRevenue), label: 'Total Revenue' },
    { Icon: Users, value: stats.totalPatients.toLocaleString(), label: 'Patients' },
    { Icon: Users, value: stats.totalNutritionists.toLocaleString(), label: 'Nutritionists' },
  ];

  return (
    <div className="page-enter space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item, idx) => (
          <Card key={idx}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold leading-none">{item.value}</h3>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="h-auto justify-start gap-3 p-4"
            onClick={() => navigate(action.path)}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <action.Icon className="h-5 w-5" />
            </div>
            <span className="font-semibold">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Platform Stats Card */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Platform Stats</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold">{stats.activeSubscriptions}</h3>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-2xl font-bold">{stats.totalNutritionists}</h3>
              <p className="text-sm text-muted-foreground">Total Nutritionists</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Dashboard Graphs (lazy-loaded) ── */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-14" />)}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
          </div>
        }
      >
        <AdminDashboardGraphs />
      </Suspense>
    </div>
  );
};

export default AdminHome;