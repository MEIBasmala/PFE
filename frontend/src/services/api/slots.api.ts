// src/services/api/slots.api.ts
import { api } from './client';
import type { AvailableSlot } from '@/types/api';

export const getSlots = (params?: { nutritionistId?: string; date?: string }) => {
  const qs = new URLSearchParams();
  if (params?.nutritionistId) qs.set('nutritionistId', params.nutritionistId);
  if (params?.date) qs.set('date', params.date);
  const tail = qs.toString();
  return api.get<AvailableSlot[]>(`/slots${tail ? `?${tail}` : ''}`);
};