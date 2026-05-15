const express = require('express');
const router = express.Router();
const recipesController = require('./recipes.controller');
const { protect, authorize } = require('../../middleware/auth');

// Public routes
router.get('/',    recipesController.getAllRecipes);
router.get('/:id', recipesController.getRecipeById);

// Patient route
router.post('/:id/log', protect, authorize('PATIENT'), recipesController.logRecipeToDiary);

// Nutritionist routes
router.post('/',      protect, authorize('NUTRITIONIST'), recipesController.createRecipe);
router.put('/:id',    protect, authorize('NUTRITIONIST'), recipesController.updateRecipe);
router.delete('/:id', protect, authorize('NUTRITIONIST'), recipesController.deleteRecipe);

module.exports = router;