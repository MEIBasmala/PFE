// src/services/api/nutritionist.api.ts
import { api, apiFetch } from './client';
import type {
  Appointment,
  Nutritionist,
  PatientProfile,
  NutritionPlan,
  Message,
  AvailableSlot,
  NutritionistAppointment
} from '@/types/api';

// Helper to transform raw appointment from backend to UI shape
const transformAppointment = (raw: any): NutritionistAppointment => {
  const dateObj = new Date(raw.slot.date);
  const dateStr = dateObj.toISOString().split('T')[0];
  return {
    id: raw.id,
    scheduledAt: dateStr,
    time: raw.slot.startTime,
    status: raw.status,
    patientName: raw.patient?.user?.fullName || 'Unknown Client',
    notes: raw.notes || undefined,
    jitsiLink: raw.jitsiLink || undefined, 
  };
};

// ============================================================
// 1. Profile
// ============================================================
export const nutritionistProfileApi = {
  get: () => apiFetch<{ success: boolean; profile: Nutritionist }>('/users/profile'),
  update: (data: Partial<Nutritionist>) =>
    apiFetch<{ success: boolean; profile: Nutritionist }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================================
// 2. Appointments
// ============================================================
export const nutritionistAppointmentsApi = {
  my: async (): Promise<{ success: boolean; appointments: NutritionistAppointment[] }> => {
    const raw = await apiFetch<{ success: boolean; appointments: any[] }>('/appointments/nutritionist');
    const transformed = raw.appointments.map(transformAppointment);
    return { success: raw.success, appointments: transformed };
  },
  confirm: (id: number) =>
    apiFetch<{ success: boolean; appointment: any }>(`/appointments/${id}/confirm`, { method: 'PUT' }),
  cancel: (id: number) =>
    apiFetch<{ success: boolean; appointment: any }>(`/appointments/${id}/cancel`, { method: 'PUT' }),
  complete: (id: number, notes?: string) =>
    apiFetch<{ success: boolean; appointment: any }>(`/appointments/${id}/complete`, { method: 'PUT', body: JSON.stringify({ notes }) }),
};

// ============================================================
// 3. Patients
// ============================================================
export const nutritionistPatientsApi = {
  my: () => apiFetch<{ success: boolean; patients: PatientProfile[] }>('/patients/my'),
  byId: (id: string | number) =>
    apiFetch<{ success: boolean; patient: PatientProfile }>(`/patients/${id}`),
};

// ============================================================
// 4. Availability Slots
// ============================================================
export const nutritionistSlotsApi = {
  my: () => apiFetch<{ success: boolean; slots: AvailableSlot[] }>('/slots/my'),
  create: (data: { date: string; startTime: string; endTime: string }) =>
    apiFetch<{ success: boolean; slot: AvailableSlot }>('/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    apiFetch<{ success: boolean }>(`/slots/${id}`, { method: 'DELETE' }),
};

// ============================================================
// 5. Nutrition Plans (PDF-only)
// ============================================================
export const nutritionistMealPlansApi = {
  list: async () => {
    const res = await apiFetch<{ success: true; plans: NutritionPlan[] }>('/nutrition-plans/my');
    // Return empty mealPlans since we no longer build recipe-based plans
    return { success: true, mealPlans: [] };
  },
  create: (data: {
    patientId: number;
    startDate: string;
    endDate: string;
    title?: string;
    notes?: string;
  }) =>
    apiFetch<{ success: boolean; plan: NutritionPlan }>('/nutrition-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  remove: (id: string | number) =>
    apiFetch<{ success: boolean }>(`/nutrition-plans/${id}`, { method: 'DELETE' }),
};

// ============================================================
// 6. Messaging (Conversations & Messages)
// ============================================================
export const nutritionistMessagesApi = {
  conversations: () =>
    apiFetch<{ success: boolean; conversations: Message[] }>('/messages/conversations'),
  messages: (conversationId: string | number) =>
    apiFetch<{ success: boolean; messages: Message[] }>(
      `/messages/conversations/${conversationId}/messages`
    ),
  send: (conversationId: string | number, content: string) =>
    apiFetch<{ success: boolean; message: Message }>(
      `/messages/conversations/${conversationId}/messages`,
      { method: 'POST', body: JSON.stringify({ content }) }
    ),
};