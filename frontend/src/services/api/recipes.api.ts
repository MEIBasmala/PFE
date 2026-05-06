// src/services/api/recipes.api.ts
import { api, apiFetch } from './client';
import type { Recipe } from '@/types/api';

export const getRecipes = (category?: string) => {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return apiFetch<Recipe[]>(`/recipes${query}`);
};
export const logRecipeToDiary = (recipeId: string, mealData: { date: string; mealType: string; time?: string }) =>
  apiFetch<{ success: boolean }>(`/recipes/${recipeId}/log`, { method: 'POST', body: JSON.stringify(mealData) });