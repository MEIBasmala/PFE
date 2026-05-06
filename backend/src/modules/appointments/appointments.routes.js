const express = require('express');
const router = express.Router();
const appointmentsController = require('./appointments.controller');
const { validateBookAppointment, validateCompleteAppointment } = require('./appointments.validation');
const { protect, authorize } = require('../../middleware/auth');

router.get('/my',               protect, authorize('PATIENT'),       appointmentsController.getPatientAppointments);
router.get('/nutritionist',     protect, authorize('NUTRITIONIST'),  appointmentsController.getNutritionistAppointments);
router.post('/',                protect, authorize('PATIENT'),       validateBookAppointment, appointmentsController.bookAppointment);
router.put('/:id/confirm',      protect, authorize('NUTRITIONIST'),  appointmentsController.confirmAppointment);
router.put('/:id/cancel',       protect,                             appointmentsController.cancelAppointment);
router.put('/:id/complete',     protect, authorize('NUTRITIONIST'),  validateCompleteAppointment, appointmentsController.completeAppointment);

module.exports = router;