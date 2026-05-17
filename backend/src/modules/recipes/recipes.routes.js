// recipes.routes.js
const express = require('express');
const router = express.Router();
const recipesController = require('./recipes.controller');
const { protect, authorize } = require('../../middleware/auth');

// Public routes
router.get('/', recipesController.getAllRecipes);

//  Patient routes 
router.get('/saved/my', protect, authorize('PATIENT'), recipesController.getSavedRecipes);  // ← BEFORE /:id
router.post('/:id/save', protect, authorize('PATIENT'), recipesController.saveRecipe);
router.delete('/:id/save', protect, authorize('PATIENT'), recipesController.unsaveRecipe);
router.post('/:id/log', protect, authorize('PATIENT'), recipesController.logRecipeToDiary);

// 
router.get('/:id', recipesController.getRecipeById);

// Nutritionist routes
router.post('/',      protect, authorize('NUTRITIONIST'), recipesController.createRecipe);
router.put('/:id',    protect, authorize('NUTRITIONIST'), recipesController.updateRecipe);
router.delete('/:id', protect, authorize('NUTRITIONIST'), recipesController.deleteRecipe);

module.exports = router;