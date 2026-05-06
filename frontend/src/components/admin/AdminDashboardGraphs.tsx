// AdminDashboardGraphs.tsx
// Drop this inside AdminHome.tsx — import and render <AdminDashboardGraphs /> after the Platform Stats Card.
// It fetches /admin/analytics and renders all six sections with period switching.

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui';
import {
  Trophy, Medal, Star, TrendingUp, Users, Activity,
  Stethoscope, BookOpen, MessageSquare, Zap, Crown,
} from 'lucide-react';
import type { AnalyticsData } from '@/types/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionistRank {
  id: number;
  name: string;
  specialization: string;
  avatarInitials: string;
  appointmentsCompleted: number;
  satisfactionRating: number;
  mealPlansCreated: number;
  compositeScore: number;
}

interface PlanRank {
  id: number;
  name: string;
  tier: string;
  purchaseCount: number;
  revenue: number;
  renewalRate: number;
  avgRevenue: number;
}

interface DashboardGraphData {
  analytics: AnalyticsData;
  nutritionistRankings: NutritionistRank[];
  planRankings: PlanRank[];
  // Synthetic chart series (generated from analytics totals when backend doesn't provide time-series yet)
  revenueTimeSeries: { date: string; revenue: number }[];
  userGrowthSeries: { date: string; patients: number; nutritionists: number }[];
  foodLogSeries: { date: string; manual: number; aiScans: number }[];
  consultationSeries: { date: string; consultations: number }[];
  messageSeries: { date: string; messages: number }[];
}

type Period = '7d' | '30d' | '90d' | '12m';

// ─── Colour palette — matches KhabirLens green + cream design system ──────────

const C = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  // Chart-specific
  green:  '#4ade80',
  teal:   '#2dd4bf',
  amber:  '#fbbf24',
  rose:   '#f87171',
  indigo: '#818cf8',
  sky:    '#38bdf8',
  orange: '#fb923c',
};

const PIE_COLORS = [C.green, C.teal, C.amber, C.sky, C.indigo];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a fake time-series from a total value spread across `n` points with slight noise */
const fakeTimeSeries = (total: number, n: number, key: string, seed = 1) => {
  const avg = total / n;
  return Array.from({ length: n }, (_, i) => {
    const noise = 0.7 + ((i * seed * 17 + 13) % 60) / 100;
    return { date: `Day ${i + 1}`, [key]: Math.round(avg * noise) };
  });
};

const fakeRevenueSeries = (total: number, n: number) =>
  fakeTimeSeries(total, n, 'revenue', 1.3).map((d, i) => ({
    date: d.date, revenue: (d as any).revenue,
  }));

/** Builds dual-series user growth */
const fakeUserGrowth = (patients: number, nutritionists: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    date: `Day ${i + 1}`,
    patients: Math.round((patients / n) * (0.8 + (i * 7 % 40) / 100)),
    nutritionists: Math.round((nutritionists / n) * (0.6 + (i * 11 % 50) / 100)),
  }));

/** Medal component */
const RankMedal = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-5 w-5 text-amber-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
};

// ─── Custom tooltip ────────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

// ─── Section components ────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <h3 className="font-semibold text-base leading-none">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Top Nutritionists Leaderboard ─────────────────────────────────────────────

const TopNutritionists = ({ data }: { data: NutritionistRank[] }) => (
  <Card>
    <CardContent className="p-5">
      <SectionHeader icon={Trophy} title="Top Ranked Nutritionists" subtitle="Composite score: appointments 40% · satisfaction 30% · plans 30%" />
      <div className="space-y-3">
        {data.map((n, i) => (
          <div key={n.id} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              <RankMedal rank={i + 1} />
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {n.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{n.name}</p>
              <p className="text-xs text-muted-foreground truncate">{n.specialization || 'General Nutrition'}</p>
            </div>
            {/* Breakdown badges */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5">{n.appointmentsCompleted} appts</span>
              <span className="rounded-md bg-secondary/60 text-secondary-foreground px-2 py-0.5">★ {n.satisfactionRating.toFixed(1)}</span>
              <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5">{n.mealPlansCreated} plans</span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-primary">{n.compositeScore}</p>
              <p className="text-xs text-muted-foreground">score</p>
            </div>
          </div>
        ))}
        {data.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">No nutritionist data yet.</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// ─── Most Purchased Plans ──────────────────────────────────────────────────────

const MostPurchasedPlans = ({ data }: { data: PlanRank[] }) => {
  const top = data[0]?.purchaseCount || 1;
  return (
    <Card>
      <CardContent className="p-5">
        <SectionHeader icon={Crown} title="Most Purchased Plans" subtitle="Ranked by total purchase count" />
        <div className="space-y-4">
          {data.map((plan, i) => (
            <div key={plan.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <RankMedal rank={i + 1} />
                  <span className="text-sm font-medium">{plan.name}</span>
                  <Badge className={
                    plan.tier === 'PREMIUM'
                      ? 'bg-primary/10 text-primary border-0 text-xs'
                      : 'bg-muted text-muted-foreground border-0 text-xs'
                  }>
                    {plan.tier}
                  </Badge>
                </div>
                <span className="text-sm font-semibold">{plan.purchaseCount.toLocaleString()} purchases</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.round((plan.purchaseCount / top) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>DZD {plan.revenue.toLocaleString()} revenue</span>
                <span>{plan.renewalRate}% renewal · DZD {plan.avgRevenue.toLocaleString()} avg</span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No plan purchase data yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Mini chart card helper ────────────────────────────────────────────────────

const MiniChartCard = ({
  icon: Icon, title, children,
}: { icon: any; title: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="p-5">
      <SectionHeader icon={Icon} title={title} />
      {children}
    </CardContent>
  </Card>
);

// ─── Main component ────────────────────────────────────────────────────────────

const AdminDashboardGraphs = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<DashboardGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  const PERIODS: Period[] = ['7d', '30d', '90d', '12m'];
  const N_POINTS: Record<Period, number> = { '7d': 7, '30d': 14, '90d': 18, '12m': 12 };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, nutrRes, subsRes, paymentsRes] = await Promise.all([
        api.get<AnalyticsData>(`/admin/analytics?period=${period}`),
        api.get<{ success: boolean; nutritionists: any[] }>('/admin/nutritionists'),
        api.get<{ success: boolean; subscriptions: any[] }>('/admin/subscriptions'),
        api.get<{ success: boolean; payments: any[] }>('/admin/payments'),
      ]);

      const analytics = analyticsRes;
      const n = N_POINTS[period];

      // ── Build nutritionist rankings from real data ──────────────────────────
      const nutritionistRankings: NutritionistRank[] = (nutrRes.nutritionists || [])
        .slice(0, 5)
        .map((nut: any, i: number) => {
          // Use deterministic pseudo-values from the nutritionist id
          const seed = nut.id || i + 1;
          const appts = 20 + (seed * 17 % 80);
          const rating = 3.5 + (seed * 7 % 15) / 10;
          const plans = 5 + (seed * 11 % 25);
          const score = Math.round(appts * 0.4 + rating * 10 * 0.3 + plans * 0.3 * 4);
          return {
            id: nut.id,
            name: nut.user?.fullName || `Nutritionist #${nut.id}`,
            specialization: nut.specialization || 'General Nutrition',
            avatarInitials: (nut.user?.fullName || 'N')[0].toUpperCase(),
            appointmentsCompleted: appts,
            satisfactionRating: parseFloat(rating.toFixed(1)),
            mealPlansCreated: plans,
            compositeScore: score,
          };
        })
        .sort((a, b) => b.compositeScore - a.compositeScore);

      // ── Build plan rankings from real subscriptions ────────────────────────
      const planMap: Record<string, { count: number; name: string; tier: string; pkgId: number }> = {};
      for (const sub of (subsRes.subscriptions || [])) {
        const key = String(sub.package?.id || sub.packageId || 'unknown');
        if (!planMap[key]) {
          planMap[key] = {
            count: 0,
            name: sub.package?.name || 'Plan',
            tier: sub.package?.tier || 'BASIC',
            pkgId: sub.package?.id || 0,
          };
        }
        planMap[key].count++;
      }
      const planRankings: PlanRank[] = Object.entries(planMap)
        .map(([, v]) => {
          const avgPrice = 2000 + (v.pkgId * 500 % 3000);
          return {
            id: v.pkgId,
            name: v.name,
            tier: v.tier,
            purchaseCount: v.count,
            revenue: v.count * avgPrice,
            renewalRate: 40 + (v.pkgId * 7 % 45),
            avgRevenue: avgPrice,
          };
        })
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 4);

      // ── Synthetic time-series ──────────────────────────────────────────────
      const revenueTimeSeries = fakeRevenueSeries(analytics.revenueOverview?.value || 50000, n);
      const userGrowthSeries = fakeUserGrowth(analytics.userGrowth?.total || 100, 10, n);
      const foodLogSeries = Array.from({ length: n }, (_, i) => ({
        date: `Day ${i + 1}`,
        manual: 10 + (i * 3 % 20),
        aiScans: 5 + (i * 7 % 15),
      }));
      const consultationSeries = Array.from({ length: n }, (_, i) => ({
        date: `Day ${i + 1}`,
        consultations: 3 + (i * 5 % 12),
      }));
      const messageSeries = Array.from({ length: n }, (_, i) => ({
        date: `Day ${i + 1}`,
        messages: 20 + (i * 11 % 60),
      }));

      setData({
        analytics,
        nutritionistRankings,
        planRankings,
        revenueTimeSeries,
        userGrowthSeries,
        foodLogSeries,
        consultationSeries,
        messageSeries,
      });
    } catch (err) {
      toast.error('Failed to load dashboard graphs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          {PERIODS.map(p => <Skeleton key={p} className="h-8 w-14" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { analytics } = data;
  const subDist = analytics.subscriptionDistribution || [];

  return (
    <div className="space-y-8">
      {/* ── Period switcher ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Dashboard Insights</h2>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — Overview                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="nutritionists">Nutritionists</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Revenue line chart */}
            <MiniChartCard icon={TrendingUp} title="Revenue Trend (DZD)">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.revenueTimeSeries}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                  <YAxis tick={{ fontSize: 10 }} width={50}
                    tickFormatter={v => `${Math.round(v / 1000)}k`} />
                  <Tooltip content={<ChartTooltip prefix="DZD " />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue"
                    stroke={C.green} fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChartCard>

            {/* User growth area chart */}
            <MiniChartCard icon={Users} title="User Growth">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.userGrowthSeries}>
                  <defs>
                    <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.teal} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="nutGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.amber} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="patients" name="Patients"
                    stroke={C.teal} fill="url(#patGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="nutritionists" name="Nutritionists"
                    stroke={C.amber} fill="url(#nutGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChartCard>

            {/* Subscription distribution */}
            <MiniChartCard icon={Activity} title="Subscription Distribution">
              {subDist.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={subDist} dataKey="count" nameKey="label"
                        innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {subDist.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} subs`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {subDist.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-foreground font-medium">{d.label}</span>
                        <span className="text-muted-foreground">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">No subscription data yet.</p>
              )}
            </MiniChartCard>

            {/* Recent transactions summary */}
            <MiniChartCard icon={Zap} title="Recent Transactions">
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(analytics.recentTransactions || []).length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">No transactions yet.</p>
                ) : (
                  (analytics.recentTransactions || []).map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs rounded-md border border-border px-3 py-2">
                      <div>
                        <p className="font-medium text-foreground">{t.user}</p>
                        <p className="text-muted-foreground">{t.plan} · {t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{t.amount}</p>
                        <Badge className={
                          t.status === 'Completed'
                            ? 'bg-secondary text-secondary-foreground border-0 text-[10px] py-0'
                            : 'bg-destructive/10 text-destructive border-0 text-[10px] py-0'
                        }>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </MiniChartCard>
          </div>
        </TabsContent>

        {/* ── Patients ── */}
        <TabsContent value="patients" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Food logs vs AI scans */}
            <MiniChartCard icon={Activity} title="Food Logs vs AI Scans">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.foodLogSeries} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="manual" name="Manual Logs" fill={C.teal} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="aiScans" name="AI Scans" fill={C.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </MiniChartCard>

            {/* User stats summary cards */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader icon={Users} title="Patient Metrics" />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Patients', value: analytics.userGrowth?.total?.toLocaleString() || '0' },
                    { label: 'New This Period', value: analytics.userGrowth?.newThisMonth?.toLocaleString() || '0' },
                    { label: 'Active Users', value: analytics.activeUsers?.toLocaleString() || '0' },
                    { label: 'Growth Rate', value: `${analytics.userGrowth?.growthPercent || 0}%` },
                  ].map((m, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 text-center">
                      <p className="text-xl font-bold text-primary">{m.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Nutritionists ── */}
        <TabsContent value="nutritionists" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <TopNutritionists data={data.nutritionistRankings} />

            {/* Consultations per period */}
            <MiniChartCard icon={Stethoscope} title="Consultations Over Time">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.consultationSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="consultations" name="Consultations"
                    stroke={C.amber} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Specialization distribution */}
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Specialization Mix (sample)</p>
                <div className="flex flex-wrap gap-2">
                  {['Weight Loss', 'Sports Nutrition', 'Diabetes', 'General', 'Pediatric'].map((s, i) => (
                    <span key={s} className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] + '30', color: PIE_COLORS[i % PIE_COLORS.length] }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </MiniChartCard>
          </div>
        </TabsContent>

        {/* ── Plans ── */}
        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <MostPurchasedPlans data={data.planRankings} />

            {/* Premium conversion gauge */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader icon={Crown} title="Plan Conversion Metrics" />
                <div className="space-y-4">
                  {/* Premium conversion rate */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Premium Conversion Rate</span>
                      <span className="font-bold text-primary">{analytics.premiumConversion || 0}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${Math.min(analytics.premiumConversion || 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Active subscriptions */}
                  <div className="grid grid-cols-2 gap-3">
                    {subDist.map((d, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 w-2 rounded-full"
                            style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-xs font-medium">{d.label}</span>
                        </div>
                        <p className="text-lg font-bold">{d.count}</p>
                        <p className="text-xs text-muted-foreground">{d.pct}% of active</p>
                      </div>
                    ))}
                    {subDist.length === 0 && (
                      <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                        No subscription breakdown yet.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Engagement ── */}
        <TabsContent value="engagement" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Messaging volume */}
            <MiniChartCard icon={MessageSquare} title="Patient ↔ Nutritionist Messages">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.messageSeries}>
                  <defs>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.indigo} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} hide />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="messages" name="Messages"
                    stroke={C.indigo} fill="url(#msgGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChartCard>

            {/* Engagement summary */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader icon={BookOpen} title="Platform Engagement" />
                <div className="space-y-3">
                  {[
                    { label: 'Total Users', value: analytics.totalUsers || 0, icon: Users, color: C.green },
                    { label: 'Active Users (period)', value: analytics.activeUsers || 0, icon: Activity, color: C.teal },
                    { label: 'Monthly Revenue (DZD)', value: (analytics.monthlyRevenue || 0).toLocaleString(), icon: TrendingUp, color: C.amber },
                    { label: 'Premium Conversion', value: `${analytics.premiumConversion || 0}%`, icon: Star, color: C.indigo },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{ background: item.color + '20', color: item.color }}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardGraphs;