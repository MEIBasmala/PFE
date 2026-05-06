// src/services/api/notifications.api.ts
import { apiFetch } from './client';
import type { Notification } from '@/types/api';

// Backend routes:
// GET    /notifications        → { success, notifications: Notification[] }
// PUT    /notifications/:id/read  → { success, notification }
// PUT    /notifications/read-all  → { success, message }

export const notificationsApi = {
  getAll: () =>
    apiFetch<{ success: boolean; notifications: Notification[] }>('/notifications'),

  markRead: (id: number) =>
    apiFetch<{ success: boolean; notification: Notification }>(
      `/notifications/${id}/read`,
      { method: 'PUT' }
    ),

  markAllRead: () =>
    apiFetch<{ success: boolean; message: string }>(
      '/notifications/read-all',
      { method: 'PUT' }
    ),
};