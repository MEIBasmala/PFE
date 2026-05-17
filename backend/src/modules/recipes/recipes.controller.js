const recipesService = require('./recipes.service');
const prisma = require('../../config/db');

const getAllRecipes = async (req, res) => {
  try {
    const { category } = req.query;
    const patientId = req.user?.role === 'PATIENT' ? req.user.patient?.id : null;
    const recipes = await recipesService.getAllRecipes(category, patientId);
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const patientId = req.user?.role === 'PATIENT' ? req.user.patient?.id : null;
    const recipe = await recipesService.getRecipeById(req.params.id, patientId);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};

const createRecipe = async (req, res) => {
  try {
    const recipe = await recipesService.createRecipe(req.body);
    res.status(201).json({ success: true, recipe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── ACTUAL DIARY LOGGING: Creates a real FoodLog entry ──
const logRecipeToDiary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, mealType, time } = req.body;
    const recipeId = req.params.id;

    // Use the existing food-logs service to create a proper log
    const foodLog = await recipesService.logRecipeAsFoodLog(userId, recipeId, {
      date,
      mealType,
      time,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Recipe logged to diary',
      log: foodLog 
    });
  } catch (error) {
    console.error('Log recipe error:', error);
    res.status(500).json({ error: error.message || 'Failed to log recipe' });
  }
};

const getPatientId = async (userId) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: parseInt(userId) }
  });
  return patient?.id;
};

// Then in saveRecipe:
const saveRecipe = async (req, res) => {
  try {
    const patientId = req.user.patient?.id || await getPatientId(req.user.id);
    if (!patientId) return res.status(403).json({ error: 'Patient profile not found' });
    
    const saved = await recipesService.saveRecipe(patientId, req.params.id);
    res.status(200).json({ success: true, saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const unsaveRecipe = async (req, res) => {
  try {
    const patientId = req.user.patient?.id || await getPatientId(req.user.id);
    if (!patientId) return res.status(403).json({ error: 'Patient profile not found' });

    await recipesService.unsaveRecipe(patientId, req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSavedRecipes = async (req, res) => {
  try {
    const patientId = req.user.patient?.id || await getPatientId(req.user.id);
    if (!patientId) return res.status(403).json({ error: 'Patient profile not found' });

    const recipes = await recipesService.getSavedRecipes(patientId);
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAllRecipes, 
  getRecipeById, 
  createRecipe,    
  updateRecipe,    
  deleteRecipe,    
  logRecipeToDiary,
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes
};