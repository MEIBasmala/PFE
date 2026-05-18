// src/services/api/appointments.api.ts
import { api, apiFetch } from './client';
import type {
  Appointment,      // ← was missing, causes all 4 errors
  Nutritionist,
} from '@/types/api';

export const appointmentApi = {
  getAppointments: () => apiFetch<any[]>('/appointments'),
  bookAppointment: (data: { nutritionistId: string; date: string; time: string; type: string }) =>
    apiFetch<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  getNutritionists: () => apiFetch<any[]>('/users?role=nutritionist'),
};

export const getMyAppointments = async (): Promise<Appointment[]> => {
  const res = await api.get<any>('/appointments/my');
  return Array.isArray(res) ? res : [];
};

// appointments.api.ts
export const getNutritionists = async (): Promise<Nutritionist[]> => {
  try {
    const res = await api.get<any[]>('/users/role/NUTRITIONIST');
    if (!Array.isArray(res)) return [];
    return res.map(user => ({
      id: user.nutritionist?.id ?? user.id,
      userId: user.id,
      specialization: user.nutritionist?.specialization || '',
      bio: user.nutritionist?.bio || '',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role as "PATIENT" | "NUTRITIONIST" | "ADMIN",
        isActive: user.isActive ?? true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
      },
    }));
  } catch (err) {
    return [];
  }
};

export const bookAppointment = (payload: { nutritionistId: string; slotId: string; notes?: string }) =>
  api.post<Appointment>('/appointments', payload);

export const cancelAppointment = (id: string) =>
  api.put<Appointment>(`/appointments/${id}/cancel`);

export const completeAppointment = (id: string, notes?: string) =>
  api.put<Appointment>(`/appointments/${id}/complete`, { notes });