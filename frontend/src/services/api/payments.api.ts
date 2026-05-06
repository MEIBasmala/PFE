// src/services/api/payments.api.ts
import { apiFetch } from './client';
import type { Payment } from '@/types/api';

export const createPaymentIntent = (packageId: string) =>
  apiFetch<{ clientSecret: string }>('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ packageId: parseInt(packageId) }),
  });
export const getPaymentHistory = () => apiFetch<Payment[]>('/payments/history');