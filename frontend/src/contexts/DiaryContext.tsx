// src/contexts/DiaryContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getMyFoodLogs, getMyFoodLogsForWeek, createFoodLog, deleteFoodLog, uploadFoodLogImage } from '@/services/api';
import type { UIFoodLog, MealCategory } from '@/types/api';
import { toIsoDate } from '@/lib/date';
import { toast } from 'sonner';
import {logger} from "@/lib/logger";

export interface DayCalories {
  date: string;   // YYYY-MM-DD
  calories: number;
}

interface DiaryContextValue {
  date: string;
  setDate: (date: string) => void;
  logs: UIFoodLog[];
  loading: boolean;
  totals: { calories: number };
  addLog: (entry: Omit<UIFoodLog, 'id' | 'loggedAt'> & { loggedAt?: string }) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  uploadImage: (file: File, category?: MealCategory) => Promise<boolean>;
  // ── week chart data ──────────────────────────────────────
  weekData: DayCalories[];
  weekLoading: boolean;
}

const DiaryContext = createContext<DiaryContextValue | undefined>(undefined);

// ── helpers ───────────────────────────────────────────────────────────────────

/** Returns the Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns an array of 7 ISO date strings Mon→Sun for the week containing `isoDate` */
function getWeekDates(isoDate: string): string[] {
  const monday = getWeekStart(new Date(isoDate));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toIsoDate(d);
  });
}

// ── provider ──────────────────────────────────────────────────────────────────

export const DiaryProvider = ({ children }: { children: ReactNode }) => {
  const [date, setDate] = useState<string>(() => toIsoDate(new Date()));
  const [logs, setLogs] = useState<UIFoodLog[]>([]);
  const [loading, setLoading] = useState(false);

  // week chart state
  const [weekData, setWeekData] = useState<DayCalories[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);

  // ── fetch single day ────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const data = await getMyFoodLogs(targetDate);
      setLogs(data);
    } catch (error) {
      logger.error('Failed to fetch diary logs', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── fetch whole week ────────────────────────────────────────────────────────
  const fetchWeek = useCallback(async (isoDate: string) => {
    setWeekLoading(true);
    try {
      const days = getWeekDates(isoDate);
      const startDate = days[0];
      const endDate = days[6];

      // Try batch endpoint first (1 call instead of 7)
      const response = await getMyFoodLogsForWeek(startDate, endDate);
      
      // Handle both { success, logs } and direct array responses
      const responseData = response as { success?: boolean; logs?: UIFoodLog[] };
      const allLogs: UIFoodLog[] = responseData.logs ?? (Array.isArray(response) ? response : []) ?? [];

      // Group by date — use any cast since backend sends estimatedAt but frontend type may call it loggedAt
      const logsByDate = new Map<string, UIFoodLog[]>();
      for (const log of allLogs) {
        const rawDate = (log as any).estimatedAt ?? (log as any).loggedAt ?? new Date();
        const dateKey = toIsoDate(new Date(rawDate));
        if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, []);
        logsByDate.get(dateKey)!.push(log);
      }

      setWeekData(
        days.map((d) => ({
          date: d,
          calories: (logsByDate.get(d) || []).reduce((sum, log) => sum + (log.calories ?? 0), 0),
        }))
      );
        } catch (error) {
      logger.error('Batch week fetch failed:', error);
      // Graceful fallback: show zeroed bars instead of firing 7 parallel calls
      const days = getWeekDates(isoDate);
      setWeekData(days.map((d) => ({ date: d, calories: 0 })));
    } finally {
      setWeekLoading(false);
    }
  }, []);

  // re-fetch day + week whenever the selected date changes
  useEffect(() => {
    fetchLogs(date);
    fetchWeek(date);
  }, [date, fetchLogs, fetchWeek]);

  // ── totals ──────────────────────────────────────────────────────────────────
  const totals = logs.reduce(
    (acc, log) => ({ calories: acc.calories + log.calories }),
    { calories: 0 }
  );

  // ── actions ─────────────────────────────────────────────────────────────────
  const addLog = async (entry: Omit<UIFoodLog, 'id' | 'loggedAt'> & { loggedAt?: string }) => {
    try {
      await createFoodLog(entry);
      // always refetch both — keeps diary list and chart in sync
      await Promise.all([fetchLogs(date), fetchWeek(date)]);
    } catch (error) {
      logger.error('Failed to add log', error);
      toast.error('Failed to add meal entry');
      throw error;
    }
  };

  const deleteLog = async (id: number) => {
    try {
      await deleteFoodLog(String(id));
      setLogs(prev => prev.filter(log => log.id !== id));
      // update the week bar for today
      await fetchWeek(date);
    } catch (error) {
      logger.error('Failed to delete log', error);
      toast.error('Failed to delete entry');
      throw error;
    }
  };

  const refresh = async () => {
    await Promise.all([fetchLogs(date), fetchWeek(date)]);
  };

    const uploadImage = async (file: File, category?: MealCategory): Promise<boolean> => {
    try {
      await uploadFoodLogImage(file, category);
      // Don't block — let diary update in background while modal closes
      Promise.all([fetchLogs(date), fetchWeek(date)]).catch(() => {});
      return true;
    } catch (error) {
      logger.error('AI analysis failed:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('limit') || msg.includes('quota')) {
        throw error;
      }
      toast.error(msg || 'AI analysis failed. Please try again.');
      return false;
    }
  };

  return (
    <DiaryContext.Provider
      value={{
        date,
        setDate,
        logs,
        loading,
        totals,
        addLog,
        deleteLog,
        refresh,
        uploadImage,
        weekData,
        weekLoading,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider');
  return ctx;
};