const prisma = require('../../config/db');

const getAllRecipes = async (where) => {
  return await prisma.recipe.findMany({ where, orderBy: { createdAt: 'desc' } });
};

const getRecipeById = async (id) => {
  return await prisma.recipe.findUnique({ where: { id } });
};

const createRecipe = async (data) => {
  return await prisma.recipe.create({
    data: {
      name: data.name,
      emoji: data.emoji || '🍽️',
      kcal: Number(data.kcal) || 0,
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fat: Number(data.fat) || 0,
      category: data.category || 'general',
      tags: data.tags || [],
      imageUrl: data.imageUrl || '',
      prepTime: data.prepTime || '30 min',
      description: data.description || null,
      difficulty: data.difficulty || null,
      ingredients: data.ingredients || [],
      instructions: data.instructions || [],
    },
  });
};
const updateRecipe = async (id, data) => {
  return await prisma.recipe.update({ where: { id }, data });
};

const deleteRecipe = async (id) => {
  return await prisma.recipe.delete({ where: { id } });
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};