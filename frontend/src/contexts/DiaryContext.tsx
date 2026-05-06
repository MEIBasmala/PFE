// src/contexts/DiaryContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getMyFoodLogs, createFoodLog, deleteFoodLog, foodApi } from '@/services/api';
import type { UIFoodLog, MealCategory } from '@/types/api';
import { toIsoDate } from '@/lib/date';
import { toast } from 'sonner';

interface DiaryContextValue {
  date: string;
  setDate: (date: string) => void;
  logs: UIFoodLog[];
  loading: boolean;
  totals: { calories: number };
  addLog: (entry: Omit<UIFoodLog, 'id' | 'loggedAt'>) => Promise<void>;
  deleteLog: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  uploadImage: (file: File) => Promise<boolean>;
}

const DiaryContext = createContext<DiaryContextValue | undefined>(undefined);

export const DiaryProvider = ({ children }: { children: ReactNode }) => {
  const [date, setDate] = useState<string>(() => toIsoDate(new Date()));
  const [logs, setLogs] = useState<UIFoodLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const data = await getMyFoodLogs(targetDate);
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch diary logs', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(date);
  }, [date, fetchLogs]);

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
    }),
    { calories: 0 }
  );

  const addLog = async (entry: Omit<UIFoodLog, 'id' | 'loggedAt'>) => {
    try {
      const newLog = await createFoodLog(entry);
      if (newLog.loggedAt?.startsWith(date)) {
        setLogs(prev => [newLog, ...prev]);
      } else {
        await fetchLogs(date);
      }
    } catch (error) {
      console.error('Failed to add log', error);
      toast.error('Failed to add meal entry');
      throw error;
    }
  };

  const deleteLog = async (id: number) => {
    try {
      await deleteFoodLog(String(id));
      setLogs(prev => prev.filter(log => log.id !== id));
    } catch (error) {
      console.error('Failed to delete log', error);
      toast.error('Failed to delete entry');
      throw error;
    }
  };

  const refresh = async () => {
    await fetchLogs(date);
  };

  const uploadImage = async (file: File): Promise<boolean> => {
    try {
      const result = await foodApi.analyzeFood(file);
      await addLog({
        name: result.name || 'Meal',
        category: result.category || 'lunch',
        calories: result.calories || 0,
        source: 'ai',
        imageUrl: result.imageUrl,
      });
      return true;
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('Could not analyze the meal. Please try again.');
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