import { api } from './client';
import type { BlogArticle } from '@/types/api';
import type { Comment as BlogComment } from '@/types/api';

export const getBlogArticles = async (params?: { category?: string; q?: string }) => {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.q) qs.set('q', params.q);
  const tail = qs.toString();
  const response = await api.get<{ success: boolean; articles: BlogArticle[] }>(
    `/blog${tail ? `?${tail}` : ''}`,
    { skipAuth: true }   // ← add this
  );
  return response.articles;
};

export const getBlogArticle = async (id: string) => {
  const response = await api.get<{ success: boolean; article: BlogArticle }>(
    `/blog/${id}`,
    { skipAuth: true }   // ← add this
  );
  return response.article;
};
export const likeBlogArticle = (id: string) => api.post<{ likes: number }>(`/blog/${id}/like`);

export const addBlogComment = async (articleId: string, content: string) => {
  const response = await api.post<{ success: boolean; comment: BlogComment }>(`/blog/${articleId}/comments`, { content });
  return response.comment;
};