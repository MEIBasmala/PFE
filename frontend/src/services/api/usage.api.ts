// src/services/api/usage.api.ts
import { api } from './client';

export const getDailyUsage = () => api.get<{ aiScansUsedToday: number }>('/food-logs/daily-usage');