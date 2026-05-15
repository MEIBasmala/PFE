// src/services/api/progress.api.ts
import { api } from './client';
import type { Measurement, Progress, ProgressPhoto } from '@/types/api';

export const getMyProgress = async (): Promise<Progress[]> => {
  const res = await api.get<any>('/progress/my');
  return Array.isArray(res) ? res : (res?.progress ?? []);
};

export const addProgress = (payload: { weight: number; measurements?: Measurement; notes?: string }) =>
  api.post<Progress>('/progress', payload);

export const getMyProgressPhotos = async (): Promise<ProgressPhoto[]> => {
  const res = await api.get<{ success: boolean; photos: ProgressPhoto[] }>('/progress/photos');
  return res.photos;
};

export const addProgressPhoto = (data: { photoUrl: string; month: string; notes?: string }) =>
  api.post<{ success: boolean; photo: ProgressPhoto }>('/progress/photos', data);
