// src/services/api/inquiries.api.ts
import { api, apiFetch } from './client';
import type { Inquiry } from '@/types/api';

export const inquiriesApi = {
  submit: (data: { name: string; email: string; message: string }) =>
    apiFetch<{ message: string }>('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
};

// Original inquiries.ts functions
export const getMyInquiries = () => apiFetch<Inquiry[]>('/inquiries/my');
export const submitInquiry = (data: { subject: string; message: string }) =>
  apiFetch<{ inquiryId: string }>('/inquiries', { method: 'POST', body: JSON.stringify(data) });