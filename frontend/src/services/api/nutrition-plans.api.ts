// src/services/api/nutrition-plans.api.ts
import { api } from './client';
import type { NutritionPlan, Meal, FoodItem , UIPlan, UIMeal} from '@/types/api';

// Transform a backend Meal (with foodItems) to UIMeal
const transformMeal = (meal: Meal): UIMeal => {
  const items = meal.foodItems ?? [];  // ← GUARD
  
  const totalCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = items.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = items.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = items.reduce((sum, item) => sum + (item.fat || 0), 0);
  
  const mealName = items.map(f => f.name).join(', ') || `${meal.mealType.toLowerCase()} meal`;
  
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
const transformPlan = (plan: NutritionPlan): UIPlan => {
  const daysMap = new Map<number, UIMeal[]>();
  
  // GUARD: handle undefined or empty meals array
  const meals = plan.meals ?? [];
  
  meals.forEach(meal => {
    const uiMeal = transformMeal(meal);
    if (!daysMap.has(uiMeal.dayNumber)) daysMap.set(uiMeal.dayNumber, []);
    daysMap.get(uiMeal.dayNumber)!.push(uiMeal);
  });
  
  const days = Array.from(daysMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, meals]) => ({ day, meals }));
  
  const dailyCalorieTarget = days[0]?.meals.reduce((sum, m) => sum + m.calories, 0) || 0;
  
  return {
    id: plan.id,
    title: plan.name || `Plan from ${plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Template'}`,
    days,
    dailyCalorieTarget,
    status: plan.status,
    startDate: plan.startDate || new Date().toISOString(),
    endDate: plan.endDate || new Date(Date.now() + (plan.durationDays || 7) * 86400000).toISOString(),
  };
};

// Get personalized plans for the logged-in user (patient)

export const getMyPlans = async () => {
  const response = await api.get<{ success: boolean; plans: NutritionPlan[] }>('/nutrition-plans/my');
  return response.plans.map(transformPlan);
};

// Get a single plan by ID
export const getPlanById = async (id: string | number) => {
  const response = await api.get<{ success: boolean; plan: NutritionPlan }>(`/nutrition-plans/${id}`);
  return transformPlan(response.plan);
};

// Get prebuilt nutrition plans (public or authenticated)
export const getPrebuiltPlans = async (): Promise<UIPlan[]> => {
  const response = await api.get<{ success: boolean; plans: NutritionPlan[] }>('/nutrition-plans/prebuilt');
  return response.plans.map(transformPlan);
};

// Create a new nutrition plan (nutritionist only) – optional for patient side
export const createPlan = (data: { patientId: number; startDate: string; endDate: string }) =>
  api.post<NutritionPlan>('/nutrition-plans', data);

// Update a plan (nutritionist only)
export const updatePlan = (id: string | number, data: Partial<NutritionPlan>) =>
  api.put<NutritionPlan>(`/nutrition-plans/${id}`, data);

// Delete a plan (nutritionist only)
export const deletePlan = (id: string | number) =>
  api.delete<{ success: boolean }>(`/nutrition-plans/${id}`);

// Add a meal to a plan (nutritionist only)
export const addMealToPlan = (planId: string | number, data: { dayNumber: number; mealType: string; instructions?: string }) =>
  api.post<Meal>(`/nutrition-plans/${planId}/meals`, data);

// Update a meal (nutritionist only)
export const updateMealInPlan = (planId: string | number, mealId: string | number, data: Partial<Meal>) =>
  api.put<Meal>(`/nutrition-plans/${planId}/meals/${mealId}`, data);

// Delete a meal from a plan (nutritionist only)
export const deleteMealFromPlan = (planId: string | number, mealId: string | number) =>
  api.delete<{ success: boolean }>(`/nutrition-plans/${planId}/meals/${mealId}`);

