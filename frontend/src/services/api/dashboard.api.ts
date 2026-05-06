// src/services/api/dashboard.api.ts
import { apiFetch } from './client';

export const dashboardApi = {
  getStats: () => apiFetch<any>('/dashboard/stats'),
  getCalories: (date: string) => apiFetch<any>(`/dashboard/calories?date=${date}`),
  getProgress: () => apiFetch<any>('/dashboard/progress'),
};