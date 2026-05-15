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

const createRecipe = async (req, res) => {
  try {
    const recipe = await recipesService.createRecipe(req.body);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create recipe' });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const recipe = await recipesService.updateRecipe(req.params.id, req.body);
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update recipe' });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    await recipesService.deleteRecipe(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
};

const logRecipeToDiary = async (req, res) => {
  try {
    // TODO: implement actual diary logging logic
    res.status(200).json({ message: 'Recipe logged to diary' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log recipe' });
  }
};

module.exports = { 
  getAllRecipes, 
  getRecipeById, 
  createRecipe,    
  updateRecipe,    
  deleteRecipe,    
  logRecipeToDiary 
};