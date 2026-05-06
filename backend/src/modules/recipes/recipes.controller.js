const recipesService = require('./recipes.service');

const getAllRecipes = async (req, res) => {
  try {
    const { category } = req.query;
    const recipes = await recipesService.getAllRecipes(category);
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const recipe = await recipesService.getRecipeById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

module.exports = { getAllRecipes, getRecipeById };