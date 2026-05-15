const recipesRepo = require('./recipes.repository');

const getAllRecipes = async (category) => {
  const where = category ? { category } : {};
  return await recipesRepo.getAllRecipes(where);
};

const getRecipeById = async (id) => {
  return await recipesRepo.getRecipeById(id);
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

module.exports = { 
  getAllRecipes, 
  getRecipeById, 
  createRecipe,
  updateRecipe,
  deleteRecipe
};