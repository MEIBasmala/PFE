// src/services/api/progress.api.ts
import { api } from './client';
import type { Measurement, Progress } from '@/types/api';

// in your api service wherever getMyProgress is defined
export const getMyProgress = async (): Promise<Progress[]> => {
  const res = await api.get<any>('/progress/my');
  // backend returns { success: true, progress: [...] } or a plain array
  return Array.isArray(res) ? res : (res?.progress ?? []);
};
export const addProgress = (payload: { weight: number; measurements?:Measurement; notes?: string }) =>
  api.post<Progress>('/progress', payload);