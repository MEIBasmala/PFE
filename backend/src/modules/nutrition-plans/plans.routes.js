const express = require('express');
const router = express.Router();
const plansController = require('./plans.controller');
const { validateCreatePlan } = require('./plans.validation');
const { protect, authorize } = require('../../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  },
});

router.post('/upload-pdf', protect, authorize('NUTRITIONIST'), upload.single('pdfFile'), plansController.uploadPdfPlan);
router.get('/pdf-plans', protect, authorize('NUTRITIONIST'), plansController.getMyPdfPlans);
router.get('/prebuilt', plansController.getPrebuiltPlans);
router.get('/my', protect, plansController.getMyPlans);

router.get('/:id', protect, plansController.getPlanById);
router.post('/', protect, authorize('NUTRITIONIST'), validateCreatePlan, plansController.createPlan);
router.put('/:id', protect, authorize('NUTRITIONIST'), plansController.updatePlan);
router.delete('/:id', protect, authorize('NUTRITIONIST'), plansController.deletePlan);

// Recipe-based meal management endpoints removed — nutritionists now use PDF plans only
// Old meal routes return 410 Gone for backward compatibility
router.post('/:id/meals', protect, authorize('NUTRITIONIST'), plansController.addMeal);
router.put('/:planId/meals/:mealId', protect, authorize('NUTRITIONIST'), plansController.updateMeal);
router.delete('/:planId/meals/:mealId', protect, authorize('NUTRITIONIST'), plansController.deleteMeal);

module.exports = router;