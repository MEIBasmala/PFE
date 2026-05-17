const express = require('express');
const router = express.Router();
const foodLogsController = require('./food-logs.controller');
const { validateUploadMeal } = require('./food-logs.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/my',          protect, authorize('PATIENT'), foodLogsController.getMyFoodLogs);
router.get('/week',        protect, authorize('PATIENT'), foodLogsController.getMyFoodLogsForWeek);  // ← ADD (before /:id!)
router.get('/daily-usage', protect, authorize('PATIENT'), foodLogsController.getDailyAiUsage); 
router.post('/',           protect, authorize('PATIENT'), foodLogsController.createFoodLog);
router.post('/upload',     protect, authorize('PATIENT'), validateUploadMeal, foodLogsController.uploadMealImage);
router.get('/:id',         protect, authorize('PATIENT'), foodLogsController.getFoodLogById);  
router.delete('/:id',      protect, authorize('PATIENT'), foodLogsController.deleteFoodLog);

module.exports = router;