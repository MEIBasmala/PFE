// src/services/api/auth.api.ts
import { apiFetch, setToken, setUser } from './client';
import type { User } from '@/types/api';

export const authApi = {
  register: async (data: { fullName: string; email: string; password: string }) => {
    const res = await apiFetch<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const user: User = {
      id: res.user.id,
      fullName: res.user.fullName,
      email: res.user.email,
      role: res.user.role, 
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { token: res.token, user };
  },
  login: async (data: { email: string; password: string }) => {
    const res = await apiFetch<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const user: User = {
      id: res.user.id,
      fullName: res.user.fullName,
      email: res.user.email,
      role: res.user.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { token: res.token, user };
  },
  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  getProfile: () => apiFetch<User>('/auth/me'),
};