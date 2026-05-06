import { api, apiFetch } from './client';
import type { PatientProfile, Nutritionist, Measurement } from '@/types/api';

const transformPatientProfile = (raw: any): PatientProfile => {
  const user = raw.user || {};
  return {
    // Patient fields
    id: raw.id,
    userId: raw.userId,
    age: raw.age,
    weight: raw.weight,
    height: raw.height,
    goalWeight: raw.goalWeight,
    dailyCalorieGoal: raw.dailyCalorieGoal,
    allergies: raw.allergies ?? [],
    conditions: raw.conditions ?? [],
    goals: raw.goals ?? [],
    activityLevel: raw.activityLevel,
    measurements: raw.measurements ?? [],
    medicalHistory: raw.medicalHistory,
    dietaryPref: raw.dietaryPref,
    waterIntake: raw.waterIntake,
    sleepHours: raw.sleepHours,
    mealsPerDay: raw.mealsPerDay,
    caffeine: raw.caffeine,
    challenges: raw.challenges,
    motivation: raw.motivation,
    // Hoisted from user
    fullName: user.fullName ?? raw.fullName ?? '',
    email: user.email ?? raw.email ?? '',
    phone: user.phone ?? raw.phone,
    // user relation (optional)
    user: {
      id: user.id,
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      role: user.role ?? 'PATIENT',
      isActive: user.isActive ?? true,
      createdAt: user.createdAt ?? '',
      updatedAt: user.updatedAt ?? '',
    },
  };
};

export const getPatientProfile = async (): Promise<PatientProfile> => {
  const res = await api.get<any>('/users/profile');
  // Backend returns { success: true, profile: { ... } }
  const raw = res?.profile ?? res;
  return transformPatientProfile(raw);
};

export const updatePatientProfile = async (patch: Partial<PatientProfile>): Promise<PatientProfile> => {
  const res = await api.put<any>('/users/profile', patch);
  const raw = res?.profile ?? res;
  return transformPatientProfile(raw);
};

export const changePassword = (currentPassword: string, newPassword: string) =>
  api.put<{ ok: true }>('/users/change-password', { currentPassword, newPassword });

export const getNutritionist = () => api.get<Nutritionist>('/users/profile');
export const updateNutritionist = (patch: Partial<Nutritionist>) =>
  api.put<Nutritionist>('/users/profile', patch);

export const usersApi = {
  getProfile: () => api.get<any>('/users/profile'),
  updateProfile: (data: any) => api.put<any>('/users/profile', data),
};