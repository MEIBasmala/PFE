// src/services/api/food-logs.api.ts
import { api, apiFetch, getToken } from './client';
import type { FoodLog, UIFoodLog, MealCategory, FoodLogUploadResult } from '@/types/api';

// Transform backend FoodLog to UI‑friendly UIFoodLog
const toUIFoodLog = (log: FoodLog): UIFoodLog => {
  const detected = (log.detectedFoods as any) || {};
  return {
    id: log.id,
    name: detected.name || 'Meal',
    category: (detected.category as MealCategory) || 'lunch',
    calories: log.totalCalories ?? 0,
    imageUrl: log.imageUrl,
    source: detected.source || (log.imageUrl ? 'ai' : 'manual'),
    loggedAt: log.estimatedAt,
    notes: detected.notes,
  };
};

// Inverse transformation: UI log to backend FoodLog (for create/update)
const toBackendFoodLog = (
  uiLog: Omit<UIFoodLog, 'id' | 'loggedAt'> & { loggedAt?: string }
) => ({
  totalCalories: uiLog.calories,
  imageUrl: uiLog.imageUrl,
  estimatedAt: uiLog.loggedAt ? new Date(uiLog.loggedAt).toISOString() : new Date().toISOString(),
  detectedFoods: {
    name: uiLog.name,
    category: uiLog.category,
    source: uiLog.source,
    notes: uiLog.notes,
  },
});

export const foodApi = {
  analyzeFood: async (imageFile: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analyze`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Food analysis failed');
    return res.json(); // expects { name, category, calories, imageUrl? }
  },
};

// Legacy object – kept for compatibility
export const foodLogsApi = {
  getLogs: (params?: { date?: string }) => {
    const query = params?.date ? `?date=${params.date}` : '';
    return apiFetch<any[]>(`/food-logs${query}`);
  },
  createLog: (data: any) => apiFetch<any>('/food-logs', { method: 'POST', body: JSON.stringify(data) }),
  updateLog: (id: string, data: any) =>
    apiFetch<any>(`/food-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLog: (id: string) => apiFetch<void>(`/food-logs/${id}`, { method: 'DELETE' }),
};

// Main functions used by the DiaryContext
export const getMyFoodLogs = async (date?: string): Promise<UIFoodLog[]> => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  const backendLogs = await api.get<FoodLog[]>(`/food-logs/my${qs}`);
  return backendLogs.map(toUIFoodLog);
};

export const getFoodLog = async (id: string): Promise<UIFoodLog> => {
  const log = await api.get<FoodLog>(`/food-logs/${id}`);
  return toUIFoodLog(log);
};

export const uploadFoodLogImage = async (file: File, category?: MealCategory): Promise<FoodLogUploadResult> => {
  const fd = new FormData();
  fd.append('image', file);
  if (category) fd.append('category', category);
  const result = await api.post<{ log: FoodLog; scansRemaining?: number }>('/food-logs/upload', fd);
  return {
    log: toUIFoodLog(result.log),
    scansRemaining: result.scansRemaining,
  };
};

export const createFoodLog = async (
  payload: Omit<UIFoodLog, 'id' | 'loggedAt'> & { loggedAt?: string }
): Promise<UIFoodLog> => {
  const backendData = toBackendFoodLog(payload);
  const created = await api.post<FoodLog>('/food-logs', backendData);
  return toUIFoodLog(created);
};

export const updateFoodLog = async (id: string, patch: Partial<UIFoodLog>): Promise<UIFoodLog> => {
  // Fetch current log to merge detectedFoods
  const current = await api.get<FoodLog>(`/food-logs/${id}`);
  const currentDetected = (current.detectedFoods as any) || {};
  const mergedDetected = {
    ...currentDetected,
    ...(patch.name && { name: patch.name }),
    ...(patch.category && { category: patch.category }),
    ...(patch.source && { source: patch.source }),
    ...(patch.notes && { notes: patch.notes }),
  };
  const backendPatch: Partial<FoodLog> = {};
  if (patch.calories !== undefined) backendPatch.totalCalories = patch.calories;
  if (patch.imageUrl !== undefined) backendPatch.imageUrl = patch.imageUrl;
  if (Object.keys(mergedDetected).length) backendPatch.detectedFoods = mergedDetected;
  const updated = await api.put<FoodLog>(`/food-logs/${id}`, backendPatch);
  return toUIFoodLog(updated);
};


export const deleteFoodLog = (id: string) =>
  api.delete<{ ok: true }>(`/food-logs/${id}`);