const prisma = require('../../config/db');

const getAllRecipes = async (where) => {
  return await prisma.recipe.findMany({ where });
};

const getRecipeById = async (id) => {
  return await prisma.recipe.findUnique({ where: { id } });
};

module.exports = { getAllRecipes, getRecipeById };