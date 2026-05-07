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


import type { ProgressPhoto } from '@/types/api';

export const getMyProgressPhotos = async (): Promise<ProgressPhoto[]> => {
  const res = await api.get<{ success: boolean; photos: ProgressPhoto[] }>('/progress/photos');
  return res.photos;
};

export const addProgressPhoto = (data: { photoUrl: string; month: string; notes?: string }) =>
  api.post<{ success: boolean; photo: ProgressPhoto }>('/progress/photos', data);