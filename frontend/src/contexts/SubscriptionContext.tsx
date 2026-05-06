// src/contexts/SubscriptionContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMySubscription, getPackages, getDailyUsage } from '@/services/api';
import type { Package, Subscription } from '@/types/api';

interface SubscriptionContextValue {
  plan: string;
  packageInfo: Package | null;
  subscription: Subscription | null;
  consultationsPerMonth: number;
  aiScansPerDay: number;
  aiScansUsedToday: number;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [packageInfo, setPackageInfo] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiScansUsedToday, setAiScansUsedToday] = useState(0);

  const plan = packageInfo?.name?.toLowerCase() || 'free';
  const consultationsPerMonth = packageInfo?.consultationsPerMonth ?? 0;
  const aiScansPerDay = packageInfo?.aiScansPerDay ?? 0;

  const refreshSubscription = async () => {
    setLoading(true);
    try {
      const [sub, pkgs, usage] = await Promise.all([
        getMySubscription().catch(() => null),
        getPackages().catch(() => []),
        getDailyUsage().catch(() => ({ aiScansUsedToday: 0 })),
      ]);
      setSubscription(sub);
      setAiScansUsedToday(usage?.aiScansUsedToday ?? 0);
      if (sub?.packageId) {
        const found = (Array.isArray(pkgs) ? pkgs : []).find(p => p.id === sub.packageId);
        setPackageInfo(found || null);
      } else {
        // Free plan fallback: find the Starter package or null
        const starter = (Array.isArray(pkgs) ? pkgs : []).find(p => p.name.toLowerCase() === 'starter');
        setPackageInfo(starter || null);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        plan,
        packageInfo,
        subscription,
        consultationsPerMonth,
        aiScansPerDay,
        aiScansUsedToday,
        loading,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};