const recipesRepo = require('./recipes.repository');

const getAllRecipes = async (category) => {
  const where = category ? { category } : {};
  return await recipesRepo.getAllRecipes(where);
};

const getRecipeById = async (id) => {
  return await recipesRepo.getRecipeById(id);
};

module.exports = { getAllRecipes, getRecipeById };