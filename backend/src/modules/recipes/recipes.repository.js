const prisma = require('../../config/db');

const getAllRecipes = async (where) => {
  return await prisma.recipe.findMany({ where, orderBy: { createdAt: 'desc' } });
};

const getRecipeById = async (id) => {
  return await prisma.recipe.findUnique({ where: { id } });
};

const createRecipe = async (data) => {
  return await prisma.recipe.create({ data });
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