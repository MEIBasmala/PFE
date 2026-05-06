import { api } from './client';
import type { BlogArticle } from '@/types/api';

export const getBlogArticles = async (params?: { category?: string; q?: string }) => {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.q) qs.set('q', params.q);
  const tail = qs.toString();
  const response = await api.get<{ success: boolean; articles: BlogArticle[] }>(`/blog${tail ? `?${tail}` : ''}`);
  return response.articles; // ← return only the array
};

export const getBlogArticle = async (id: string) => {
  const response = await api.get<{ success: boolean; article: BlogArticle }>(`/blog/${id}`);
  return response.article; // ← return only the article object
};

export const likeBlogArticle = (id: string) => api.post<{ likes: number }>(`/blog/${id}/like`);