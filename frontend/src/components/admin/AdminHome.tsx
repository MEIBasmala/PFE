// src/modules/admin/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Card, CardContent, Button, Badge, Skeleton,
} from '@/components/ui';
import {
  Users, TrendingUp, Activity, Crown, Receipt,
  UserPlus, Mail, RefreshCw, Award,
} from 'lucide-react';
import type { AnalyticsData, Payment, Nutritionist, SubscriptionWithUser } from '@/types/api';

// ─── Types ─────────────────────────────────────────────────
type Period = '7d' | '30d' | '90d' | '12m';

interface DashboardStats {
  totalPatients: number;
  totalNutritionists: number;
  activeSubscriptions: number;
  totalRevenue: number;
}

// ─── Colors ────────────────────────────────────────────────
const CHART_COLORS = {
  green: 'hsl(var(--green))',
  teal: 'hsl(var(--green-dark))',          
  amber: 'hsl(var(--saffron))',
  indigo: 'hsl(var(--orange))',            
  rose: 'hsl(var(--error))',
};
const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.teal, CHART_COLORS.amber, CHART_COLORS.indigo];

// ─── Helper ─────────────────────────────────────────────────
const aggregateRevenueByDate = (payments: Payment[], startDate: Date) => {
  const filtered = payments.filter(p => new Date(p.createdAt) >= startDate);
  const map = new Map<string, number>();
  filtered.forEach(p => {
    const date = new Date(p.createdAt).toISOString().split('T')[0];
    map.set(date, (map.get(date) || 0) + p.amount);
  });
  return Array.from(map.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// ─── Main Component ─────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [revenueTimeSeries, setRevenueTimeSeries] = useState<{ date: string; revenue: number }[]>([]);

  const PERIODS: Period[] = ['7d', '30d', '90d', '12m'];

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, analyticsRes, nutrRes, subsRes, paymentsRes] = await Promise.all([
        api.get<{ success: boolean; stats: DashboardStats }>('/admin/statistics'),
        api.get<AnalyticsData>(`/admin/analytics?period=${period}`),
        api.get<{ success: boolean; nutritionists: Nutritionist[] }>('/admin/nutritionists'),
        api.get<{ success: boolean; subscriptions: SubscriptionWithUser[] }>('/admin/subscriptions'),
        api.get<{ success: boolean; payments: Payment[] }>('/admin/payments'),
      ]);

      setStats(statsRes.stats);
      setAnalytics(analyticsRes);
      setNutritionists(nutrRes.nutritionists || []);
      setSubscriptions(subsRes.subscriptions || []);

      // Build revenue time series from real payments
      const now = new Date();
      let startDate = new Date();
      if (period === '12m') startDate.setFullYear(now.getFullYear() - 1);
      else startDate.setDate(now.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90));
      const series = aggregateRevenueByDate(paymentsRes.payments || [], startDate);
      setRevenueTimeSeries(series);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const quickActions = [
    { Icon: UserPlus, label: 'Add Nutritionist', path: '/admin/nutritionists' },
    { Icon: Mail, label: 'View Inquiries', path: '/admin/inquiries' },
  ];

  // Derived data
  const totalUsers = stats ? stats.totalPatients + stats.totalNutritionists : 0;
  const premiumConversion = analytics?.premiumConversion ?? 0;
  const subDist = analytics?.subscriptionDistribution ?? [];

  // Top plans from real subscriptions
  const planRankings = Object.values(
    subscriptions.reduce((acc, sub) => {
      const pkg = sub.package;
      if (!pkg) return acc;
      if (!acc[pkg.id]) {
        acc[pkg.id] = { id: pkg.id, name: pkg.name, tier: pkg.tier, purchaseCount: 0, revenue: 0 };
      }
      acc[pkg.id].purchaseCount++;
      acc[pkg.id].revenue += sub.amount;
      return acc;
    }, {} as Record<number, { id: number; name: string; tier: string; purchaseCount: number; revenue: number }>)
  ).sort((a, b) => b.purchaseCount - a.purchaseCount).slice(0, 4);

  // Top nutritionists (sorted alphabetically – replace with real scoring when available)
  const topNutritionists = [...nutritionists]
    .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName))
    .slice(0, 5);

  if (loading || !stats || !analytics) {
    return (
      <div className="space-y-6">
        {/* Skeleton for period switcher */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            {PERIODS.map(p => <Skeleton key={p} className="h-8 w-14" />)}
          </div>
        </div>
        {/* Skeleton for stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        {/* Skeleton for charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with period selector and refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {PERIODS.map(p => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="px-3"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={fetchAllData} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{totalUsers.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">DZD {stats.totalRevenue.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.activeSubscriptions}</h3>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{premiumConversion}%</h3>
              <p className="text-sm text-muted-foreground">Premium Conversion</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-2">Revenue Trend</h3>
            <p className="text-xs text-muted-foreground mb-4">Daily revenue (DZD)</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTimeSeries}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} width={45} />
                <Tooltip formatter={(v: number) => `DZD ${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.green} fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscription Distribution (Pie + Legend) */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-2">Subscription Distribution</h3>
            {subDist.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={subDist} dataKey="count" nameKey="label" innerRadius={45} outerRadius={70}>
                      {subDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} subs`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {subDist.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="font-medium">{d.label}</span>
                      <span className="text-muted-foreground">{d.count} ({d.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No subscription data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top Nutritionists, Most Purchased Plans, Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Nutritionists */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Top Nutritionists</h3>
            </div>
            <div className="space-y-3">
              {topNutritionists.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No nutritionists yet</p>
              ) : (
                topNutritionists.map((n, i) => (
                  <div key={n.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground w-5">#{i+1}</span>
                      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {n.user.fullName[0]}
                      </div>
                      <span>{n.user.fullName}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{n.specialization || 'General'}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Purchased Plans */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Most Purchased Plans</h3>
            </div>
            <div className="space-y-4">
              {planRankings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No purchases yet</p>
              ) : (
                planRankings.map((plan, i) => (
                  <div key={plan.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground w-5">#{i+1}</span>
                        <span className="font-medium">{plan.name}</span>
                        <Badge variant="outline" className="text-xs">{plan.tier}</Badge>
                      </div>
                      <span>{plan.purchaseCount} purchases</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(plan.purchaseCount / planRankings[0].purchaseCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Recent Transactions</h3>
            </div>
            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {(analytics.recentTransactions || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                analytics.recentTransactions.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-border pb-2">
                    <div>
                      <p className="font-medium">{t.user}</p>
                      <p className="text-muted-foreground">{t.plan} · {t.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{t.amount}</p>
                      <Badge className={t.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;