// src/services/api/nutrition-plans.api.ts
import { api } from './client';
import type { NutritionPlan, UIPlan } from '@/types/api';

// Transform a backend Meal (with foodItems) to UIMeal
const transformMeal = (meal: any): any => {
  const items = meal.foodItems ?? [];
  const totalCalories = items.reduce((sum: number, item: any) => sum + (item.calories || 0), 0);
  const totalProtein = items.reduce((sum: number, item: any) => sum + (item.protein || 0), 0);
  const totalCarbs = items.reduce((sum: number, item: any) => sum + (item.carbs || 0), 0);
  const totalFat = items.reduce((sum: number, item: any) => sum + (item.fat || 0), 0);
  const mealName = items.map((f: any) => f.name).join(', ') || `${meal.mealType.toLowerCase()} meal`;

  return {
    id: meal.id,
    name: mealName,
    calories: totalCalories,
    macros: { protein: totalProtein, carbs: totalCarbs, fat: totalFat },
    mealType: meal.mealType,
    dayNumber: meal.dayNumber,
  };
};

// Transform a backend NutritionPlan to UIPlan
const transformPlan = (plan: any): UIPlan => {
  const daysMap = new Map<number, any[]>();
  const meals = plan.meals ?? [];

  meals.forEach((meal: any) => {
    const uiMeal = transformMeal(meal);
    if (!daysMap.has(uiMeal.dayNumber)) daysMap.set(uiMeal.dayNumber, []);
    daysMap.get(uiMeal.dayNumber)!.push(uiMeal);
  });

  const days = Array.from(daysMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, meals]) => ({ day, meals }));

  const dailyCalorieTarget = days[0]?.meals.reduce((sum: number, m: any) => sum + m.calories, 0) || 0;

  return {
    id: plan.id,
    title: plan.name || `Plan from ${plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Template'}`,
    days,
    dailyCalorieTarget,
    status: plan.status,
    startDate: plan.startDate || new Date().toISOString(),
    endDate: plan.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
  };
};

// Get personalized plans for the logged-in user (patient) — returns RAW NutritionPlan for PDF display
export const getMyPlans = async () => {
  const response = await api.get<{ success: boolean; plans: NutritionPlan[] }>('/nutrition-plans/my');
  return response.plans;
};

// Get prebuilt nutrition plans — returns UIPlan for meal grid display
export const getPrebuiltPlans = async () => {
  const response = await api.get<{ success: boolean; plans: any[] }>('/nutrition-plans/prebuilt');
  return response.plans.map(transformPlan);
};

// Get a single plan by ID
export const getPlanById = async (id: string | number) => {
  const response = await api.get<{ success: boolean; plan: NutritionPlan }>(`/nutrition-plans/${id}`);
  return response.plan;
};

// Create a new nutrition plan (nutritionist only)
export const createPlan = (data: { patientId: number; startDate: string; endDate: string; title?: string; notes?: string }) =>
  api.post<NutritionPlan>('/nutrition-plans', data);

// Update a plan (nutritionist only)
export const updatePlan = (id: string | number, data: Partial<NutritionPlan>) =>
  api.put<NutritionPlan>(`/nutrition-plans/${id}`, data);

// Delete a plan (nutritionist only)
export const deletePlan = (id: string | number) =>
  api.delete<{ success: boolean }>(`/nutrition-plans/${id}`);

