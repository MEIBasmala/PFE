import { api, apiFetch } from './client';
import type { Recipe } from '@/types/api';

export const getRecipes = (category?: string) => {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return apiFetch<Recipe[]>(`/recipes${query}`);
};

export const getRecipeById = (id: string) =>
  apiFetch<Recipe>(`/recipes/${id}`);

// Save/unsave to personal collection (bookmarks)
export const saveRecipe = (recipeId: string) =>
  apiFetch<{ success: boolean }>(`/recipes/${recipeId}/save`, { method: 'POST' });

export const unsaveRecipe = (recipeId: string) =>
  apiFetch<{ success: boolean }>(`/recipes/${recipeId}/save`, { method: 'DELETE' });

export const getSavedRecipes = () =>
  apiFetch<Recipe[]>('/recipes/saved/my');

// NOTE: We no longer use logRecipeToDiary from here.
// Recipe logging is done via DiaryContext.addLog() instead.