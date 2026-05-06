const express = require('express');
const router = express.Router();
const recipesController = require('./recipes.controller');

// Public endpoints (no authentication needed for viewing recipes)
router.get('/', recipesController.getAllRecipes);
router.get('/:id', recipesController.getRecipeById);

module.exports = router;



