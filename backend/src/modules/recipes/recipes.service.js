const recipesRepo = require('./recipes.repository');
const prisma = require('../../config/db');

const getAllRecipes = async (category, patientId) => {
  const where = category ? { category } : {};
  const recipes = await recipesRepo.getAllRecipes(where);
  
  if (patientId) {
    const saved = await prisma.savedRecipe.findMany({
      where: { patientId },
      select: { recipeId: true }
    });
    const savedSet = new Set(saved.map(s => s.recipeId));
    return recipes.map(r => ({ ...r, isSaved: savedSet.has(r.id) }));
  }
  
  return recipes;
};

const getRecipeById = async (id, patientId) => {
  const recipe = await recipesRepo.getRecipeById(id);
  if (!recipe) return null;
  
  if (patientId) {
    const saved = await prisma.savedRecipe.findUnique({
      where: { patientId_recipeId: { patientId, recipeId: id } }
    });
    return { ...recipe, isSaved: !!saved };
  }
  
  return recipe;
};

const createRecipe = async (data) => {
  return await recipesRepo.createRecipe(data);
};

const updateRecipe = async (id, data) => {
  return await recipesRepo.updateRecipe(id, data);
};

const deleteRecipe = async (id) => {
  return await recipesRepo.deleteRecipe(id);
};

// ── THE KEY FIX: Log recipe as actual FoodLog ──
const logRecipeAsFoodLog = async (userId, recipeId, { date, mealType, time }) => {
  // 1. Get patient from userId
  const patient = await prisma.patient.findUnique({
    where: { userId: parseInt(userId) }
  });
  if (!patient) throw new Error('Patient profile not found');

  // 2. Get the recipe
  const recipe = await recipesRepo.getRecipeById(recipeId);
  if (!recipe) throw new Error('Recipe not found');

  // 3. Build the detectedFoods JSON (same structure as AI logs)
  const detectedFoods = {
    name: recipe.name,
    category: mealType || recipe.category || 'lunch',
    source: 'recipe',          // ← marks it as from recipe library
    notes: `Recipe: ${recipe.name} | ${recipe.prepTime} | P:${recipe.protein}g C:${recipe.carbs}g F:${recipe.fat}g`,
    macros: {
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat
    }
  };

  // 4. Determine timestamp
  const estimatedAt = time 
    ? new Date(`${date}T${time}`)
    : new Date(`${date}T12:00:00`);

  // 5. Create the FoodLog using the SAME table as AI/manual logs
  const foodLog = await prisma.foodLog.create({
    data: {
      patientId: patient.id,
      imageUrl: recipe.imageUrl || null,
      detectedFoods: detectedFoods,
      totalCalories: recipe.kcal,
      confidenceScore: 1.0,  // Recipes are 100% accurate
      estimatedAt: estimatedAt,
    }
  });

  // 6. Create a dummy AI estimation for consistency
  await prisma.aIEstimation.create({
    data: {
      foodLogId: foodLog.id,
      modelVersion: 'recipe-log',
      detectedItems: {
        recipeId: recipe.id,
        recipeName: recipe.name,
        ingredients: recipe.ingredients || []
      },
      processingTime: 0,
      warning: false
    }
  });

  // 7. Return with relations (same shape as other food logs)
  return await prisma.foodLog.findUnique({
    where: { id: foodLog.id },
    include: { aiEstimation: true }
  });
};

// ── Save/unsave ──
const saveRecipe = async (patientId, recipeId) => {
  return await prisma.savedRecipe.upsert({
    where: { patientId_recipeId: { patientId, recipeId } },
    update: {},
    create: { patientId, recipeId }
  });
};

const unsaveRecipe = async (patientId, recipeId) => {
  await prisma.savedRecipe.delete({
    where: { patientId_recipeId: { patientId, recipeId } }
  });
};

const getSavedRecipes = async (patientId) => {
  const saved = await prisma.savedRecipe.findMany({
    where: { patientId },
    select: { recipeId: true }
  });
  
  const recipeIds = saved.map(s => s.recipeId);
  return await prisma.recipe.findMany({
    where: { id: { in: recipeIds } }
  });
};

module.exports = { 
  getAllRecipes, 
  getRecipeById, 
  createRecipe,
  updateRecipe,
  deleteRecipe,
  logRecipeAsFoodLog,
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes
};