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
        getDailyUsage().catch(() => null), // null on error
      ]);
      setSubscription(sub);

      // Resolve package info first (needed for safe fallback)
      const packages = Array.isArray(pkgs) ? pkgs : [];
      let currentPackage: Package | null = null;
      if (sub?.packageId) {
        currentPackage = packages.find(p => p.id === sub.packageId) || null;
      } else {
        currentPackage = packages.find(p => p.name.toLowerCase() === 'starter') || null;
      }
      setPackageInfo(currentPackage);

      // Safe usage: if fetch failed, assume limit reached
      const scansPerDay = currentPackage?.aiScansPerDay ?? 0;
      if (usage !== null) {
        setAiScansUsedToday(usage.aiScansUsedToday ?? 0);
      } else {
        console.warn('Could not fetch daily usage — assuming limit reached');
        setAiScansUsedToday(scansPerDay); // assume exhausted
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