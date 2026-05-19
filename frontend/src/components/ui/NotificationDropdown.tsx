// src/components/ui/NotificationDropdown.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Calendar, CreditCard, MessageSquare, Zap, Camera } from 'lucide-react';
import { notificationsApi } from '@/services/api';
import type { Notification } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';

const typeConfig: Record<
  Notification['type'],
  { icon: React.ReactNode; bg: string; color: string }
> = {
  MESSAGE:     { icon: <MessageSquare size={14} />, bg: 'bg-[hsl(var(--orange-20))]',   color: 'text-[hsl(var(--orange))]' },
  APPOINTMENT: { icon: <Calendar size={14} />,      bg: 'bg-[hsl(var(--green-light))]', color: 'text-[hsl(var(--green-dark))]' },
  PAYMENT:     { icon: <CreditCard size={14} />,    bg: 'bg-[hsl(var(--saffron-light))]', color: 'text-[hsl(var(--saffron))]' },
  PLAN:        { icon: <Zap size={14} />,           bg: 'bg-[hsl(var(--green-light))]', color: 'text-[hsl(var(--green-dark))]' },
  PROGRESS_PHOTO: { icon: <Camera size={14} />,         bg: 'bg-[hsl(var(--blue-light))]', color: 'text-[hsl(var(--blue-dark))]' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.notifications ?? []);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // ── FIX: Listen for real-time notification refresh events ──
  useEffect(() => {
    const handleRefresh = () => load();
    window.addEventListener('notifications:refresh', handleRefresh);
    return () => window.removeEventListener('notifications:refresh', handleRefresh);
  }, [load]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const markRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await notificationsApi.markRead(id);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      load();
    }
  };

  // ── FIX: Navigate based on notification type ──
  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id);
    setOpen(false);

    const role = user?.role;
    switch (notif.type) {
      case 'MESSAGE':
        if (role === 'PATIENT') navigate('/patient/messages');
        else if (role === 'NUTRITIONIST') navigate('/nutritionist/messages');
        break;
      case 'APPOINTMENT':
        if (role === 'PATIENT') navigate('/patient/consultations');
        else if (role === 'NUTRITIONIST') navigate('/nutritionist/appointments');
        break;
      case 'PLAN':
        if (role === 'PATIENT') navigate('/patient/nutrition-plans');
        break;
      case 'PAYMENT':
        if (role === 'PATIENT') navigate('/patient/subscription');
        break;
      case 'PROGRESS_PHOTO':
        if (role === 'PATIENT') navigate('/patient');
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="tb-bell"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[hsl(var(--orange))] text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] max-h-[420px] bg-[hsl(var(--pure-white))] border border-[hsl(var(--gray-line))] rounded-2xl shadow-[var(--sh-l)] z-50 animate-slideIn overflow-hidden max-sm:w-[calc(100vw-2rem)] max-sm:right-[-60px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--gray-line))]">
            <span className="font-syne font-bold text-sm">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[hsl(var(--orange))] text-white text-[0.6rem] font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                className="text-[0.7rem] font-semibold text-[hsl(var(--orange))] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1"
                onClick={markAllRead}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[340px]">
            {loading && (
              <div className="p-6 text-center text-sm text-[hsl(var(--text-l))]">Loading…</div>
            )}
            {!loading && error && (
              <div className="p-6 text-center text-sm text-[hsl(var(--error))]">{error}</div>
            )}
            {!loading && !error && notifications.length === 0 && (
              <div className="p-6 text-center text-sm text-[hsl(var(--text-l))]">
                <Bell size={24} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            )}
            {!loading && !error && notifications.map((n) => {
              const cfg = typeConfig[n.type] ?? typeConfig.PLAN;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-[hsl(var(--gray-line))] last:border-b-0 cursor-pointer transition-colors hover:bg-[hsl(var(--gray-bg))] ${
                    !n.isRead ? 'bg-[hsl(var(--green-light)/.3)]' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[0.8rem] text-[hsl(var(--text-dark))] capitalize">
                        {n.type.toLowerCase()}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--orange))] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[0.75rem] text-[hsl(var(--text-m))] line-clamp-2">
                      {n.message}
                    </p>
                    <span className="text-[0.65rem] text-[hsl(var(--text-l))]">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;