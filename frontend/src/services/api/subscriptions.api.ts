// src/services/api/subscriptions.api.ts
import { apiFetch } from './client';
import type { Package, Subscription } from '@/types/api';

// subscriptions.api.ts
export const getPackages = async (): Promise<Package[]> => {
  const data = await apiFetch<any[]>('/subscriptions/packages');
  if (!Array.isArray(data)) return [];
  return data.map(pkg => ({
    id: pkg.id ?? pkg._id,          // handle both until backend is consistent
    name: pkg.name,
    tier: pkg.tier,
    priceMonthly: pkg.priceMonthly ?? null,
    priceYearly: pkg.priceYearly ?? null,
    price: pkg.price ?? null,
    duration: pkg.duration ?? null,
    aiScansPerDay: pkg.aiScansPerDay ?? 0,
    consultationsPerMonth: pkg.consultationsPerMonth ?? 0,
    chatbot: pkg.chatbot ?? false,
    mealPlanType: pkg.mealPlanType ?? null,
    highlight: pkg.highlight ?? false,
    isSeasonal: pkg.isSeasonal ?? false,
    features: Array.isArray(pkg.features) ? pkg.features : [],
    currency: pkg.currency ?? 'DZD',
  }));
};

export const getMySubscription = () => apiFetch<Subscription>('/subscriptions/my');
export const createSubscription = (packageId: string) =>
  apiFetch<{ subscriptionId: string }>('/subscriptions', { method: 'POST', body: JSON.stringify({ packageId: parseInt(packageId) }) });