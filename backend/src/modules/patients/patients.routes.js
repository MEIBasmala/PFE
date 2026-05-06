// backend/src/modules/patients/patients.routes.js
const express = require('express');
const router = express.Router();
const patientsController = require('./patients.controller');
const { protect, authorize } = require('../../middleware/auth');

// All routes require authentication and nutritionist role
router.get('/my', protect, authorize('NUTRITIONIST'), patientsController.getMyPatients);
router.get('/:id', protect, authorize('NUTRITIONIST'), patientsController.getPatientById);

module.exports = router;