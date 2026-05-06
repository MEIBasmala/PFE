import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Users,
  Activity,
  TrendingUp,
  Award,
  CreditCard,
  Zap,
  Target,
  Bot,
  Receipt,
  BarChart3,
  RefreshCw,
  Download,
} from 'lucide-react';
import { api } from '@/services/api';
import { AnalyticsData, ChatbotStats } from '@/types/api';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';

type Period = '7d' | '30d' | '90d' | '12m';

const barColor = (label: string) => {
  if (label === 'Premium') return 'bg-primary';
  if (label === 'Basic') return 'bg-kl-saffron';
  if (label === 'Free') return 'bg-muted-foreground';
  return 'bg-kl-green';
};

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [chatbotStats, setChatbotStats] = useState<ChatbotStats | null>(null);
  const [chatbotLoading, setChatbotLoading] = useState(true);

  const periods: { key: Period; label: string }[] = [
    { key: '7d', label: 'Last 7 days' },
    { key: '30d', label: 'Last 30 days' },
    { key: '90d', label: 'Last 90 days' },
    { key: '12m', label: 'Last 12 months' },
  ];

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const json = await api.get<AnalyticsData>(`/admin/analytics?period=${period}`);
      setData(json);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatbotStats = async () => {
    setChatbotLoading(true);
    try {
      const json = await api.get<{ stats: ChatbotStats }>('/chatbot/stats');
      setChatbotStats(json.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setChatbotLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchChatbotStats();
  }, [period]);

  if (loading || !data) {
    return (
      <div className="page-enter space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header with period filters and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {periods.map(p => (
            <Button
              key={p.key}
              variant={period === p.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid – same style as AdminHome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <span className="text-xs text-kl-green-dark">↑ {data.userGrowth.growthPercent}% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{data.activeUsers.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Active Users (30d)</p>
              <span className="text-xs text-kl-green-dark">↑ 8% vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">DZD {data.monthlyRevenue.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <span className={`text-xs ${data.userGrowth.growthPercent >= 0 ? 'text-kl-green-dark' : 'text-destructive'}`}>
                {data.userGrowth.growthPercent >= 0 ? '↑' : '↓'} {Math.abs(data.userGrowth.growthPercent)}% this month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{data.premiumConversion}%</h3>
              <p className="text-sm text-muted-foreground">Premium Conversion</p>
              <span className="text-xs text-kl-green-dark">↑ 2.1% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & User Growth cards (icons added) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Revenue Overview</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-6 bg-muted/20 rounded-xl">
              <p className="text-3xl font-bold">DZD {data.revenueOverview.value.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Avg: DZD {data.revenueOverview.avgPerDay}/day</p>
              <p className="text-xs text-kl-green-dark mt-2">↑ {data.revenueOverview.changePercent}% vs last month</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">User Growth</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-6 bg-muted/20 rounded-xl">
              <p className="text-3xl font-bold">{data.userGrowth.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">New this month: {data.userGrowth.newThisMonth}</p>
              <p className="text-xs text-kl-green-dark mt-2">↑ {data.userGrowth.growthPercent}% growth</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Distribution & Recent Transactions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Subscription Distribution</h2>
              </div>
              <Button variant="ghost" size="sm">View Details</Button>
            </div>
            <div className="space-y-4">
              {data.subscriptionDistribution.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">
                      {s.count.toLocaleString()} ({s.pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(s.label)}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((t, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2">{t.date}</td>
                      <td className="py-2 font-medium">{t.user}</td>
                      <td className="py-2">{t.amount}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chatbot Stats – Provider & Intents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {chatbotLoading ? (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Bot className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Loading chatbot insights...</p>
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Chatbot Provider Split</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gemini</span>
                      <span>{chatbotStats?.providers.geminiPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${chatbotStats?.providers.geminiPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ollama</span>
                      <span>{chatbotStats?.providers.ollamaPercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-kl-saffron"
                        style={{ width: `${chatbotStats?.providers.ollamaPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cache</span>
                      <span>{chatbotStats?.providers.cachePercentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-kl-green"
                        style={{ width: `${chatbotStats?.providers.cachePercentage}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Avg response time: {chatbotStats?.overview.avgResponseTime}ms
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Patient Intents</h2>
                </div>
                <div className="space-y-4">
                  {chatbotStats?.intents?.map((intent, i) => {
                    const intentColors = [
                      'bg-primary',
                      'bg-kl-green',
                      'bg-kl-saffron',
                      'bg-primary/60',
                      'bg-kl-green-dark',
                    ];
                    const color = intentColors[i % intentColors.length];
                    return (
                      <div key={intent.intent}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{intent.intent}</span>
                          <span>{intent.percentage}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${intent.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;