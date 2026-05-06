const express = require('express');
const router = express.Router();
const plansController = require('./plans.controller');
const { validateCreatePlan, validateAddMeal } = require('./plans.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/prebuilt',                                                                             plansController.getPrebuiltPlans);

router.get('/my',                           protect,                                                plansController.getMyPlans);
router.get('/:id',                          protect,                                                plansController.getPlanById);
router.post('/',                            protect, authorize('NUTRITIONIST'), validateCreatePlan, plansController.createPlan);
router.put('/:id',                          protect, authorize('NUTRITIONIST'),                     plansController.updatePlan);
router.delete('/:id',                       protect, authorize('NUTRITIONIST'),                     plansController.deletePlan);
router.post('/:id/meals',                   protect, authorize('NUTRITIONIST'), validateAddMeal,    plansController.addMeal);
router.put('/:planId/meals/:mealId',        protect, authorize('NUTRITIONIST'),                     plansController.updateMeal);
router.delete('/:planId/meals/:mealId',     protect, authorize('NUTRITIONIST'),                     plansController.deleteMeal);

module.exports = router;                    