import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Zap, Target, Bot, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { ChatbotStats } from '@/types/api';
import { Card, CardContent, Button, Skeleton } from '@/components/ui';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [chatbotStats, setChatbotStats] = useState<ChatbotStats | null>(null);

  const fetchChatbotStats = async () => {
    setLoading(true);
    try {
      const json = await api.get<{ stats: ChatbotStats }>('/chatbot/stats');
      setChatbotStats(json.stats);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load chatbot analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbotStats();
  }, []);

  if (loading || !chatbotStats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={fetchChatbotStats}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Provider Split */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Provider Split</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Gemini</span>
                  <span>{chatbotStats.providers.geminiPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${chatbotStats.providers.geminiPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ollama</span>
                  <span>{chatbotStats.providers.ollamaPercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-kl-saffron"
                    style={{ width: `${chatbotStats.providers.ollamaPercentage}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Cache</span>
                  <span>{chatbotStats.providers.cachePercentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-kl-green"
                    style={{ width: `${chatbotStats.providers.cachePercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Avg response time: {chatbotStats.overview.avgResponseTime}ms · Total messages: {chatbotStats.overview.totalMessages}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Patient Intents */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Client Intents</h2>
            </div>
            <div className="space-y-4">
              {chatbotStats.intents.map((intent, i) => {
                const colors = ['bg-primary', 'bg-kl-green', 'bg-kl-saffron', 'bg-primary/60', 'bg-kl-green-dark'];
                const color = colors[i % colors.length];
                return (
                  <div key={intent.intent}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{intent.intent}</span>
                      <span>{intent.percentage}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${intent.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optional: add more advanced charts here later (user growth over time, etc.) */}
    </div>
  );
};

export default AdminAnalytics;