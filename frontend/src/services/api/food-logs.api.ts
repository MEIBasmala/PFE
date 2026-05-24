// src/services/api/food-logs.api.ts
import { api } from './client';
import type { FoodLog, UIFoodLog, MealCategory, FoodLogUploadResult } from '@/types/api';

// Compress image before upload
const compressImage = async (file: File, maxWidth = 800): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Compression failed'));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
};
// ── Cloudinary helper ─────────────────────────────────────────────────────────
const uploadToCloudinary = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_FOOD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd }
  );

  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
};

// ── Transformations ───────────────────────────────────────────────────────────

const toUIFoodLog = (log: FoodLog): UIFoodLog => {
  const detected = (log.detectedFoods as any) || {};
  return {
    id: log.id,
    name: detected.name || 'Meal',
    category: (detected.category as MealCategory) || 'lunch',
    calories: Math.round(log.totalCalories ?? 0),
    imageUrl: log.imageUrl,
    source: detected.source || (log.imageUrl ? 'ai' : 'manual'),
    loggedAt: log.estimatedAt,
    notes: detected.notes,
    macros: detected.macros ? {
      protein: Math.round(detected.macros.protein),
      carbs: Math.round(detected.macros.carbs),
      fat: Math.round(detected.macros.fat),
    } : undefined,
    items: detected.items || undefined,
  };
};

const toBackendFoodLog = (
  uiLog: Omit<UIFoodLog, 'id' | 'loggedAt'> & { loggedAt?: string }
) => ({
  totalCalories: uiLog.calories,
  imageUrl: uiLog.imageUrl,
  estimatedAt: uiLog.loggedAt
    ? new Date(uiLog.loggedAt).toISOString()
    : new Date().toISOString(),
  detectedFoods: {
    name: uiLog.name,
    category: uiLog.category,
    source: uiLog.source,
    notes: uiLog.notes,
  },
});

// ── Main API functions ────────────────────────────────────────────────────────

export const getMyFoodLogs = async (date?: string): Promise<UIFoodLog[]> => {
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await api.get<any>(`/food-logs/my${qs}`);
  // guard against wrapped response: { logs: [...] } or plain array
  const backendLogs: FoodLog[] = Array.isArray(res) ? res : (res?.logs ?? []);
  return backendLogs.map(toUIFoodLog);
};

export const getFoodLog = async (id: string): Promise<UIFoodLog> => {
  const log = await api.get<FoodLog>(`/food-logs/${id}`);
  return toUIFoodLog(log);
};

export const uploadFoodLogImage = async (
  file: File,
  category?: MealCategory
): Promise<FoodLogUploadResult> => {
  // 1. Compress image client-side
  const compressed = await compressImage(file, 800);
  const compressedFile = new File([compressed], file.name, { type: 'image/jpeg' });

  // 2. Upload compressed image to Cloudinary
  const imageUrl = await uploadToCloudinary(compressedFile);

  // 3. Send to backend
  const result = await api.post<{ log: FoodLog; scansRemaining?: number }>(
    '/food-logs/upload',
    { imageUrl, category }
  );

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

export const updateFoodLog = async (
  id: string,
  patch: Partial<UIFoodLog>
): Promise<UIFoodLog> => {
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

export const getMyFoodLogsForWeek = async (startDate: string, endDate: string): Promise<UIFoodLog[]> => {
  const response = await api.get<{ success: boolean; logs: FoodLog[] }>(
    `/food-logs/week?startDate=${startDate}&endDate=${endDate}`
  );
  
  // Extract raw FoodLog array from the wrapped response
  const rawLogs: FoodLog[] = response?.logs ?? [];
  
  // Transform each raw log to UIFoodLog (same transformation as getMyFoodLogs)
  return rawLogs.map(toUIFoodLog);
};