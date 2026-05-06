const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const { validateCreateNutritionist } = require('./admin.validation');
const { protect, authorize } = require('../../middleware/auth');
const { ROLES } = require('./admin.config');

const requireAdmin = [protect, authorize(ROLES.ADMIN)];

router.get('/patients', requireAdmin, adminController.getAllPatients);
router.put('/patients/:id/toggle', requireAdmin, adminController.togglePatientStatus);
router.delete('/patients/:id', requireAdmin, adminController.deletePatient);
router.get('/nutritionists', requireAdmin, adminController.getAllNutritionists);
router.post('/nutritionists', requireAdmin, validateCreateNutritionist, adminController.createNutritionist);
router.put('/nutritionists/:id/toggle', requireAdmin, adminController.toggleNutritionistStatus);
router.delete('/nutritionists/:id', requireAdmin, adminController.deleteNutritionist);
router.get('/statistics', requireAdmin, adminController.getStatistics);
router.get('/audit-logs', requireAdmin, adminController.getAuditLogs);
router.get('/subscriptions', requireAdmin, adminController.getAllSubscriptions);
router.get('/payments', requireAdmin, adminController.getAllPayments);
router.get('/payments/export', requireAdmin, adminController.exportPaymentsCSV);
router.get('/analytics', requireAdmin, adminController.getAnalytics);
router.get('/blog', requireAdmin, adminController.getAdminBlogPosts);
router.post('/blog', requireAdmin, adminController.createAdminBlogPost);
router.put('/blog/:id', requireAdmin, adminController.updateAdminBlogPost);
router.delete('/blog/:id', requireAdmin, adminController.deleteAdminBlogPost);

module.exports = router;