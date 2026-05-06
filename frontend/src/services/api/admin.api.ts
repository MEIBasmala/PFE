// src/services/api/admin.api.ts
import { api, apiFetch, apiFetchBlob } from './client';
import { toast } from 'sonner';
import type {
  Patient,
  Nutritionist,
  BlogArticle,
  Package,
  Payment,
  DashboardStats,
  AuditLog,
  SubscriptionWithUser,
} from '@/types/api';



// ── Stats ───────────────────────────────────────────────────

export const getAdminStats = () =>
  apiFetch<{ success: boolean; stats: DashboardStats }>('/admin/statistics');

// ── Patients ────────────────────────────────────────────────

export const getAdminPatients = () =>
  apiFetch<{ success: boolean; patients: Patient[] }>('/admin/patients');

export const togglePatientStatus = (id: number) =>
  apiFetch<{ success: boolean; result: Patient }>(
    `/admin/patients/${id}/toggle`,
    { method: 'PUT' }
  );

export const deletePatient = (id: number) =>
  apiFetch<{ success: boolean }>(`/admin/patients/${id}`, { method: 'DELETE' });

// ── Nutritionists ───────────────────────────────────────────

export const getAdminNutritionists = () =>
  apiFetch<{ success: boolean; nutritionists: Nutritionist[] }>('/admin/nutritionists');

export const createNutritionist = (data: {
  fullName: string;
  email: string;
  specialization?: string;
  bio?: string;
}) =>
  apiFetch<{ success: boolean; nutritionist: Nutritionist; tempPassword: string }>(
    '/admin/nutritionists',
    { method: 'POST', body: JSON.stringify(data) }
  );

export const toggleNutritionistStatus = (id: number) =>
  apiFetch<{ success: boolean; result: Nutritionist }>(
    `/admin/nutritionists/${id}/toggle`,
    { method: 'PUT' }
  );

export const deleteNutritionist = (id: number) =>
  apiFetch<{ success: boolean }>(
    `/admin/nutritionists/${id}`,
    { method: 'DELETE' }
  );

// ── Audit Logs ──────────────────────────────────────────────

export const getAuditLogs = () =>
  apiFetch<{ success: boolean; logs: AuditLog[] }>('/admin/audit-logs');

// ── Blog ────────────────────────────────────────────────────

export const getAdminBlogPosts = () =>
  apiFetch<{ success: boolean; posts: BlogArticle[] }>('/admin/blog');

export const createBlogPost = (data: {
  title: string;
  content: string;
  category?: string;
  coverImage?: string;
  status: 'DRAFT' | 'PUBLISHED';
}) =>
  apiFetch<{ success: boolean; post: BlogArticle }>(
    '/admin/blog',
    { method: 'POST', body: JSON.stringify(data) }
  );

export const updateBlogPost = (
  id: number,
  data: Partial<{
    title: string;
    content: string;
    category: string;
    coverImage: string;
    status: 'DRAFT' | 'PUBLISHED';
  }>
) =>
  apiFetch<{ success: boolean; post: BlogArticle }>(
    `/admin/blog/${id}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );

export const deleteBlogPost = (id: number) =>
  apiFetch<{ success: boolean }>(`/admin/blog/${id}`, { method: 'DELETE' });

// ── Subscriptions & Payments ────────────────────────────────

export const getAdminSubscriptions = () =>
  apiFetch<{ success: boolean; subscriptions: SubscriptionWithUser[] }>('/admin/subscriptions');

export const getAdminPayments = () =>
  apiFetch<{ success: boolean; payments: Payment[] }>('/admin/payments');

export const exportPaymentsCSV = async () => {
  try {
    const blob = await apiFetchBlob('/admin/payments/export');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Export failed');
  }
};

// ── Legacy object (keep temporarily if other files still import adminApi.X)
// Remove once all call sites are migrated to the named exports above.
export const adminApi = {
  getAdminStats,
  getAdminBlogPosts,
  createBlogPost,
  getAdminSubscriptions,
  getAllPayments: getAdminPayments,
  exportPaymentsCSV,
};